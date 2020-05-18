import {NodeCollection, NodeSingular} from "cytoscape";
import {addX} from "../utils";
import {Indices, Index} from './Indexing'
import {BTMParams} from "./optimisation";

const addParentScore = (nodes:NodeCollection, scores: Map<string, Map<string, number>>, propagationWeights: number[]) => {
    const parents = new Map<string, string>()
    const getParentScore = (node1:string, node2:string, weights: number[]) => {
        if (weights.length == 0)
            return 0
        const w = weights.concat()
        const weight = w.shift()

        const parent1 = parents.get(node1)
        const parent2 = parents.get(node2)
        const parentScore = parent1 && parent2
            ? scores.get(parents.get(node1)).get(parents.get(node2))
            : 0
        return weight * parentScore + getParentScore(parent1, parent2, w)
    }
    nodes.forEach(node => {
        const parent = node.parent()
        parents.set(node.id(), parent.size() == 0 ? null : parent.first().id())
    })

    const newScores = new Map<string, Map<string, number>>()
    scores.forEach((scoresOfNode1, node1) => {
        const newScoresOfNode1 = new Map<string, number>()
        scoresOfNode1.forEach((score, node2) => {
            const newScore = score + getParentScore(node1, node2, propagationWeights)
            newScoresOfNode1.set(node2, newScore)
            newScores.set(node1, newScoresOfNode1)
        })
    })

    return newScores
}

const computeInitialScores = (indices: Indices, numberOfNodesInIndex:number, nodes:NodeCollection) => {
    const idfPrecomputation = Math.log(numberOfNodesInIndex)
    const computeIdf = (numberOfNodesWithToken:number) => idfPrecomputation - Math.log(numberOfNodesWithToken)
    const idfCache = new Map<string, number>()

    const computeScore = (index:Index, tokens:string[]) => {
        const scores = new Map<string, number>()
        tokens.forEach(token => {
            const documentsThatHaveThisToken = index.get(token) || new Set()
            const idf = idfCache.get(token) || computeIdf(documentsThatHaveThisToken.size)
            idfCache.set(token, idf)
            documentsThatHaveThisToken.forEach(doc => addX(scores, doc, idf))
        })

        return scores
    }

    const computeScoreForOneNode = (node:NodeSingular) => {
        const XPATH_WEIGHT = 1
        const VALUE_WEIGHT = 1

        const xPathScore = computeScore(indices.xPathIndex, [node.data('xPath')])
        const valueScore = computeScore(indices.valueIndex, node.data('value'))

        const result = new Map<string, number>()
        const neighbors = Array.from(new Set([...xPathScore.keys(), ...valueScore.keys()]))
        neighbors.forEach(n => {
            const xPath = xPathScore.get(n) || 0
            const value = valueScore.get(n) || 0
            result.set(n, xPath * XPATH_WEIGHT + value * VALUE_WEIGHT)
        })

        return result
    }

    const scoresPerNode = new Map<string, Map<string, number>>()
    nodes.forEach(node => {
        const scoresForNode = computeScoreForOneNode(node)
        scoresPerNode.set(node.id(), scoresForNode)
    })

    return scoresPerNode
}

const computeNeighborsFromScores = (maxNumberOfNeighbors:number) => (scores: Map<string, number>) => {
    const sortedScores = Array.from(scores)
        .filter(([,score]) => score > 0)
        .sort(([,score1], [,score2]) => score2 - score1) // descending

    return sortedScores.slice(0, maxNumberOfNeighbors)
}

export const getNearestNeighbors = (params:BTMParams, indices: Indices, numberOfNodesInIndex:number) => (nodes:NodeCollection) => {
    if (numberOfNodesInIndex <= 0)
        return new Map<string, [string, number][]>()

    const initialScore = computeInitialScores(indices, numberOfNodesInIndex, nodes)
    const scoresDepth1 = addParentScore(nodes, initialScore, params.propagationWeights)
    // const scoresDepth1 = initialScore

    const result = new Map<string, [string, number][]>()
    scoresDepth1.forEach((scores, node) => {
        result.set(node, computeNeighborsFromScores(params.maxNumberOfNeighbors)(scores))
    })

    return result
}
