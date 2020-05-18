import cytoscape from "cytoscape"
import {NodeSingular} from "cytoscape";
import axios from 'axios'

export type TreeMatchingParameters = {
    insertionCost : number,
    deletionCost : number,
    relabelCost : number,
    rtedApiUrl: string
}

type TreeMatchingResponse = {
    time: number,
    distance: number,
    matching: Array<{
        id1: number,
        id2: number
    }>
}

const cyToBrackets = (tree:cytoscape.Core) => {
    const root = tree.nodes().filter(node => node.parents().size() === 0)
    const postOrderIds = new Map<number, string>()
    let counter = 1
    const computeIds = (node:NodeSingular) => {
        node.children().forEach(child => {computeIds(child)})
        postOrderIds.set(counter, node.id())
        counter++
    }
    const toBracket = (node:NodeSingular) => {
        const value = node.data('value')
        const childrenValue = node.children().map(child => toBracket(child)).join('')
        if (childrenValue == null || childrenValue == '')
            return `{${value}}`

        return `{${value}${childrenValue}}`
    }

    computeIds(root)
    return {bracket: toBracket(root), ids: postOrderIds}
}

export const matchTrees = (params:TreeMatchingParameters) => async (tree1:cytoscape.Core, tree2: cytoscape.Core) => {
    const {bracket: bracket1, ids: ids1} = cyToBrackets(tree1)
    const {bracket: bracket2, ids: ids2} = cyToBrackets(tree2)
    // console.log(ids1)
    // console.log(ids2)
    const request =  {
        t1: bracket1,
        t2: bracket2,
        insertionCost: params.insertionCost,
        deletionCost: params.deletionCost,
        relabelCost: params.relabelCost
    }

    // console.log('REQUEST')
    // console.log(request)
    const response = await axios.post<TreeMatchingResponse>(params.rtedApiUrl, request)
    // console.log(response.data)
    return {
        time: response.data.time,
        distance: response.data.distance,
        matching: response.data.matching.map(match => ({
            id1: ids1.get(match.id1),
            id2: ids2.get(match.id2)
        }))
    }
}
