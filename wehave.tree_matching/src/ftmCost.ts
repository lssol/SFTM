import cy from "cytoscape"
import {relabelCosts} from "./flexible";
import {FTMCost, Matching} from "./types";

export type Weights = {
    relabel: number,
    sibling: number,
    ancestors: number,
    noMatch: number
}
type EdgeWithCost = {
    id1: string,
    id2: string,
    costRelabel: number,
    costSibling: number,
    costAncestry: number,
    costNoMatch: number,
    cost: number
}

const precomputeEdgeWith = (matching:Matching) => {
    const edgeWith1 = new Map<string, string>()
    const edgeWith2 = new Map<string, string>()
    matching.matching.forEach(match => {
        edgeWith1.set(match.id1, match.id2)
        edgeWith2.set(match.id2, match.id1)
    })

    return {edgeWith1, edgeWith2}
}
// In case of ancestry nodes = children, in case of siblings nodes = siblings
const nbViolations = (nodes1:cy.NodeCollection, edgeWith1:Map<string, string>, nodes2Ids:string[]) => {
    let nbViolations = 0
    nodes1.forEach(child => {
        const matchedNodeId = edgeWith1.get(child.id())
        if (!nodes2Ids.includes(matchedNodeId) && matchedNodeId != null)
            nbViolations++
    })

    return nbViolations
}

export const computeFTMCost = (tree1: cy.Core, tree2: cy.Core, matching: Matching, weights: Weights) => {
    const computeCosts = (edge:{id1:string, id2:string}) => {
        const {edgeWith1, edgeWith2} = precomputeEdgeWith(matching)
        const node1 = tree1.$id(edge.id1)
        const node2 = tree2.$id(edge.id2)

        if (node1.empty() || node2.empty())
            return <EdgeWithCost> {
                costNoMatch: weights.noMatch,
                costSibling: 0,
                costAncestry: 0,
                costRelabel: 0,
                cost: weights.noMatch,
                id1: edge.id1,
                id2: edge.id2
            }

        const string1 = (<string[]>node1.data('value')).concat([node1.data('xPath')])
        const string2 = (<string[]>node2.data('value')).concat([node2.data('xPath')])

        const relabelCost = relabelCosts.countSameWords(string1, string2)

        const children1 = node1.children()
        const children2 = node2.children()
        const children1Ids = children1.map(c => c.id())
        const children2Ids = children2.map(c => c.id())
        const totalChildren = children1Ids.length + children2Ids.length
        const ancestryCost = totalChildren == 0
            ? 0
            : (nbViolations(children1, edgeWith1, children2Ids) + nbViolations(children2, edgeWith2, children1Ids)) / totalChildren


        /// SIBLINGS
        const siblings1 = node1.siblings()
        const siblings2 = node2.siblings()
        const siblings1Ids = siblings1.map(c => c.id())
        const siblings2Ids = siblings2.map(c => c.id())
        const totalSiblings = siblings1Ids.length + siblings2Ids.length
        const siblingCost = totalSiblings == 0
            ? 0
            : (nbViolations(siblings1, edgeWith1, siblings2Ids) + nbViolations(siblings2, edgeWith2, siblings1Ids)) / totalSiblings

        const totalCost =
              weights.relabel   * relabelCost
            + weights.ancestors * ancestryCost
            + weights.sibling   * siblingCost

        return <EdgeWithCost>{
            ...edge,
            costRelabel: relabelCost,
            costAncestry: ancestryCost,
            costSibling: siblingCost,
            costNoMatch: 0,
            cost: totalCost
        }
    }

    const edgeWithCost = matching.matching.map(computeCosts)
    return <FTMCost> {
        relabel: edgeWithCost.reduce((acc, cur) => acc + cur.costRelabel, 0),
        ancestry: edgeWithCost.reduce((acc, cur) => acc + cur.costAncestry, 0),
        sibling: edgeWithCost.reduce((acc, cur) => acc + cur.costSibling, 0),
        nomatch: edgeWithCost.reduce((acc, cur) => acc + cur.costNoMatch, 0),
        totalCost: edgeWithCost.reduce((acc, cur) => acc + cur.cost, 0)
    }
}
