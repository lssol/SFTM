import {metropolisAlgorithm, pick, range, shuffle, pushAt} from "../utils";
import {performance} from 'perf_hooks'
import {LinkedList} from "./LinkedArray";

export const NO_MATCH_NODE = 'NO_MATCH_NODE'
export type Edge = {
    node2: string,
    node1: string,
    cost: number
}

export type BTMParams = {
    maxNumberOfNeighbors: number,
    limitNodesPerToken: (n:number) => number,
    noMatchNodeCost: number,
    gamma: number,
    lambda: number,
    nbIterationsMetropolis: number,
    propagationWeights: number[]
}
type PrecomputedActions = {
    getEdgesToRemove: (edgeToKeep: Edge) => Set<Edge>,
    getOrderedEdges: LinkedList<Edge>,
}
const precomputeTree = (allPossibleEdges: Set<Edge>)  => {
    const mapConnectedEdges = (() => {
        const map = new Map<string, Set<Edge>>()
        allPossibleEdges.forEach(edge => {
            pushAt(map, 't1__' + edge.node2, new Set([edge]))
            pushAt(map, 't2__' + edge.node1, new Set([edge]))
        })

        return map
    })()
    const mapAdjacentEdges = (() => {
        const map = new Map<Edge, Set<Edge>>()
        allPossibleEdges.forEach(edge => {
            if (edge.node2 != NO_MATCH_NODE)
                pushAt(map, edge, mapConnectedEdges.get('t1__' + edge.node2))
            if (edge.node1 != NO_MATCH_NODE)
                pushAt(map, edge, mapConnectedEdges.get('t2__' + edge.node1))
            map.get(edge).delete(edge)
        })

        return map
    })()
    const orderedEdges = new LinkedList(Array.from(allPossibleEdges).sort((a, b) => a.cost - b.cost))
    const getEdgesToRemove = (edgeToKeep: Edge) => mapAdjacentEdges.get(edgeToKeep) || new Set()

    return <PrecomputedActions>{
        getEdgesToRemove: getEdgesToRemove,
        getOrderedEdges: orderedEdges,
    }
}
const computeObjective = (params:BTMParams) => (matching: Set<Edge>) => {
    let costSum = 0
    matching.forEach(edge => costSum += edge.cost)
    const cost = costSum / matching.size

    return Math.exp(-params.lambda * cost)
}

const suggestMatching = (params:BTMParams, precomputedActions: PrecomputedActions) => {
    const removedEdges = new Set<Edge>()
    const acceptEdge = (edgesToKeep: Set<Edge>, allEdges: LinkedList<Edge>, edgeToKeep: Edge) => {
        edgesToKeep.add(edgeToKeep)
        const deleted = allEdges.delete(edgeToKeep)
        if (deleted === false)
            throw 'The accepted edge had already been deleted, it should never happen'
        removedEdges.add(edgeToKeep)
        precomputedActions.getEdgesToRemove(edgeToKeep).forEach(edge => {
            allEdges.delete(edge)
            removedEdges.add(edge)
        })
    }

    const fixRandomNumberOfEdgesFromPreviousMatching = (previousMatching: Set<Edge>, allEdges: LinkedList<Edge>) => {
        const matchingArr       = Array.from(previousMatching)
        const nbMatchingsToKeep = pick(previousMatching.size, 0)
        const map               = shuffle(range(previousMatching.size))
        const edgesToKeep       = new Set<Edge>()
        for (let i = 0; i < nbMatchingsToKeep; i++) {
            acceptEdge(edgesToKeep, allEdges, matchingArr[map[i]])
        }

        return edgesToKeep
    }
    const fixEdgesIterativelyUntilMatchingIsComplete = (edgesToKeep: Set<Edge>, edges: LinkedList<Edge>) => {
        const maxIter = 10 * edges.length
        let i = 0
        while (!edges.isEmpty() && i < maxIter) {
            const iter = edges[Symbol.iterator]()
            let edge = iter.next()
            while (!edge.done) {
                if (Math.random() <= params.gamma) {
                    acceptEdge(edgesToKeep, edges, edge.value)
                    break
                }
                edge = iter.next()
            }
            iter.return()
            i++
        }
        if (!edges.isEmpty())
            throw 'The loop to suggest the next matching has reached its max iteration limit: ' + i
    }
    return (matching: Set<Edge>) => {
        const allEdges = new LinkedList(precomputedActions.getOrderedEdges)
        const edgesToKeep = fixRandomNumberOfEdgesFromPreviousMatching(matching, allEdges)
        fixEdgesIterativelyUntilMatchingIsComplete(edgesToKeep, allEdges)
        return edgesToKeep
    }
}



// const multiplyCost = (params:BTMParams, allPossibleMatching:Set<Edge>) => {
//     allPossibleMatching.forEach(edge => edge.cost = params.relabelCost * edge.cost)
// }

export const findOptimumMatching = (params:BTMParams) => (allPossibleEdges: Set<Edge>) => {
    const precomputedActions = precomputeTree(allPossibleEdges)

    const nextMatching = suggestMatching(params, precomputedActions)
    const initialMatching = nextMatching(new Set())
    const objectiveFunction = computeObjective(params)
    const bestMatching = metropolisAlgorithm(initialMatching, nextMatching, objectiveFunction, params.nbIterationsMetropolis)

    return {
        distance: objectiveFunction(bestMatching),
        matching: Array.from(bestMatching).map(edge => ({id1: edge.node1, id2: edge.node2})),
    }
}
