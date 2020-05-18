import cytoscape from "cytoscape";
import {getIndex} from "./Indexing";
import {getNearestNeighbors} from "./nearestNeighbors";
import {BTMParams, Edge, findOptimumMatching, NO_MATCH_NODE} from "./optimisation";
import {Matching} from "../types";

const getNoMatchEdges = (params:BTMParams, nodes1: Set<string>, nodes2: Set<string>) => {
    const noMatchNodes = new Set<Edge>()
    nodes1.forEach(node => {
        noMatchNodes.add({node2: NO_MATCH_NODE, node1: node, cost: params.noMatchNodeCost})
    })
    nodes2.forEach(node => {
        noMatchNodes.add({node2: node, node1: NO_MATCH_NODE, cost: params.noMatchNodeCost})
    })
    return noMatchNodes
}

export const matchTrees = (params:BTMParams) => (tree1:cytoscape.Core, tree2: cytoscape.Core) => {
    const start = new Date().getTime()
    const nodes1 = tree1.nodes()
    const nodes2 = tree2.nodes()
    const indices = getIndex(nodes1, params.limitNodesPerToken)
    const neighbors = getNearestNeighbors(params, indices, nodes1.size())(nodes2)

    const allPossibleEdges = new Set<Edge>()

    neighbors.forEach((neighbors, node2) => {
        neighbors.forEach(([neighbor, score]) => {
            allPossibleEdges.add({
                node2: node2,
                node1: neighbor,
                cost: 1 / (1 + score)
            })
        })
    })

    getNoMatchEdges(params, new Set(nodes1.map(n => n.id())), new Set(nodes2.map(n => n.id())))
        .forEach(edge => allPossibleEdges.add(edge))

    const t0 = new Date().getTime()
    const matches = findOptimumMatching(params)(allPossibleEdges)
    const end = new Date().getTime()

    console.log(`Metropolis took: ${end - t0}`)

    return <Matching> {
        time: end - start,
        ...matches
    }
}

export {BTMParams}

// const durations = []

// const obs = new PerformanceObserver(list => {
//     durations.push(list.getEntries()[0].duration)
//     performance.clearMarks()
// })
// obs.observe({entryTypes: ['measure']})
//nodes2.forEach((node, i) => {
// performance.mark('Start GetNeighbors')
//neighbors[i] = [node.id(), getNeighbors(node)]
// performance.mark('End GetNeighbors')
// performance.measure('Neighbor ' + i, 'Start GetNeighbors', 'End GetNeighbors')
// })
// durations.forEach(console.log)
