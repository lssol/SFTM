import cytoscape from 'cytoscape'
import {EdgeSingular, NodeCollection, NodeDefinition, NodeSingular} from "cytoscape";
import {generateId, metropolisAlgorithm, pick, range, round, shuffle} from "../utils";


export type TreeMatchingParameters = {
    weightRelabel : number,
    weightAncestry: number,
    weightSibling : number,
    weightNoMatch : number,
    gamma         : number,
    beta          : number,
    nbIteration   : number,
}
export type Match = {
    m: string,
    n: string,
    cost: number,
    costExplained: string
}

export const matchTrees = <T>(params: TreeMatchingParameters, customRelabelCost: (value1:T, value2:T) => number) => (tree1:cytoscape.Core, tree2:cytoscape.Core) => {
    enum OriginTree {Tree1, Tree2}
    const mapToCompleteGraph = new Map<NodeSingular, string>()
    const {children, siblings} = (() => {
        const mapChildren = new Map<NodeSingular, NodeCollection>()
        const mapSiblings = new Map<NodeSingular, NodeCollection>()

        const save = (node:NodeSingular) => {
            mapChildren.set(node, node.children())
            mapSiblings.set(node, node.siblings())
        }

        tree1.nodes().forEach(save)
        tree2.nodes().forEach(save)

        return {children: mapChildren, siblings: mapSiblings}
    })()
    const completeGraph = (() => {
        const nodes1 = tree1.nodes()
        const nodes2 = tree2.nodes()

        const nodeToClone = ((originTree:OriginTree) => (node:NodeSingular) => {
            const newId = generateId()
            mapToCompleteGraph.set(node, newId)
            return <NodeDefinition>{
                group: 'nodes',
                data: {
                    id: newId,
                    originId: node.id(),
                    noMatchNode: false,
                    originTree: originTree,
                    value: node.data('value')
                }
            }
        })

        const result = cytoscape({
            headless: true,
            elements: [
                ...nodes1.map(nodeToClone(OriginTree.Tree1)),
                ...nodes2.map(nodeToClone(OriginTree.Tree2)),
                {group: 'nodes', data: {id:'noMatch1', originTree:OriginTree.Tree1, noMatchNode: true, value: 'noMatch1'}},
                {group: 'nodes', data: {id:'noMatch2', originTree:OriginTree.Tree2, noMatchNode: true, value: 'noMatch2'}}
            ],
        })
        const newNodes1 = Array.from(result.nodes().filter(n => n.data('originTree') === OriginTree.Tree1))
        const newNodes2 = Array.from(result.nodes().filter(n => n.data('originTree') === OriginTree.Tree2))
        for (let n1 of newNodes1)
            for (let n2 of newNodes2)
                result.add(<cytoscape.EdgeDefinition>{
                    group: 'edges',
                    data: {
                        id: generateId(),
                        source: n1.id(),
                        target: n2.id()
                    }
                })
        return result
    })()
    const allOriginalNodes = Array.from(mapToCompleteGraph.keys())

    const toCompleteGraphNode = (nodes: NodeCollection) => {
        const result = completeGraph.collection()
        nodes.forEach(node => {
            result.merge(completeGraph.$id(mapToCompleteGraph.get(node)))
        })

        return result
    }

    const noMatchNodes = () => {
        const result = completeGraph.collection()
        result.merge(completeGraph.$id('noMatch1'))
        result.merge(completeGraph.$id('noMatch2'))

        return result
    }

    const getOriginal = (n:NodeSingular) => {
        if (n.data('noMatchNode'))
            return null
        if (n.data('originTree') === OriginTree.Tree1)
            return tree1.$id(n.data('originId'))
        return tree2.$id(n.data('originId'))
    }
    type Indicator = (m:NodeSingular) => 1|0
    type Indicators = {
        ancestry: {upper: Indicator, lower: Indicator},
        sibling: {
            inv:{upper: Indicator, lower: Indicator},
            div:{upper: Indicator, lower: Indicator},
        }
    }
    const indicators = new Map(allOriginalNodes.map(node => {
        const ancestryUpper = (n: NodeSingular) => {
            const nodesNotChildrenOfNInOriginalTree =
                n.cy().nodes()
                    .difference(children.get(n))
            const nodesNotChildrenOfN = toCompleteGraphNode(nodesNotChildrenOfNInOriginalTree).difference(noMatchNodes())
            return (mChild:NodeSingular) => {
                if (toCompleteGraphNode(mChild).edgesWith(nodesNotChildrenOfN).size() > 0)
                    return 1
                return 0
            }
        }
        const ancestryLower = (n: NodeSingular) => {
            const childrenOfN = toCompleteGraphNode(children.get(n)).union(noMatchNodes())
            return (mChild:NodeSingular) => {
                if (toCompleteGraphNode(mChild).edgesWith(childrenOfN).size() === 0)
                    return 1
                return 0
            }
        }
        const siblingDivUpper = (n:NodeSingular) => {
            const nodesNotSiblingOfNInOriginalTree = n.cy().nodes().difference(siblings.get(n))
            const nodesNotSiblingOfN = toCompleteGraphNode(nodesNotSiblingOfNInOriginalTree)
                .difference(noMatchNodes())
            return (mSibling:NodeSingular) => {
                if (toCompleteGraphNode(mSibling).edgesWith(nodesNotSiblingOfN).size() > 0)
                    return 1
                return 0
            }
        }
        const siblingDivLower = (n:NodeSingular) => {
            const siblingOfN = toCompleteGraphNode(siblings.get(n)).union(noMatchNodes())
            return (mSibling:NodeSingular) => {
                if (toCompleteGraphNode(mSibling).edgesWith(siblingOfN).size() === 0)
                    return 1
                return 0
            }
        }
        const siblingInvUpper = (n:NodeSingular) => {
            const siblingOfN = toCompleteGraphNode(siblings.get(n))
            return (mSibling:NodeSingular) => {
                if (toCompleteGraphNode(mSibling).edgesWith(siblingOfN).size() > 0)
                    return 1
                return 0
            }
        }
        const siblingInvLower = (n:NodeSingular) => {
            const siblingOfN = toCompleteGraphNode(siblings.get(n))
            return (mSibling:NodeSingular) => {
                if (toCompleteGraphNode(mSibling).connectedEdges().difference(siblingOfN).size() > 0)
                    return 0
                return 1
            }
        }

        return <[NodeSingular, Indicators]>[node, <Indicators>{
            ancestry: {upper:ancestryUpper(node), lower: ancestryLower(node)},
            sibling: {
                div: {upper: siblingDivUpper(node), lower: siblingDivLower(node)},
                inv: {upper: siblingInvUpper(node), lower: siblingInvLower(node)},
            }
        }]
    }))

    const computeEdgeCost = (edge:cytoscape.EdgeSingular) => {
        const source = edge.source()
        const target = edge.target()
        const originSource = getOriginal(source)
        const originTarget = getOriginal(target)

        const relabelCosts = new Map<EdgeSingular, number>()

        if (originTarget == null || originSource == null) {
            const cost = params.weightNoMatch
            edge.data('cost', cost)
            edge.data('costExplained', 'No Match = ' + cost)

            return
        }

        const relabelCost = (() => {
            if (relabelCosts.has(edge))
                return relabelCosts.get(edge)

            const cost = customRelabelCost(originSource.data('value'), originTarget.data('value'))
            relabelCosts.set(edge, cost)
            return cost
        })()
        const ancestryCost = (() => {
            const upper = children.get(originSource).map(indicators.get(originTarget).ancestry.upper).reduce((a, b) => a + b, 0)
                + children.get(originTarget).map(indicators.get(originSource).ancestry.upper).reduce((a, b) => a + b, 0)

            const lower = children.get(originSource).map(indicators.get(originTarget).ancestry.lower).reduce((a, b) => a + b, 0)
                + children.get(originTarget).map(indicators.get(originSource).ancestry.lower).reduce((a, b) => a + b, 0)

            return {upper, lower}
        })()
        const siblingCost = (() => {
            const upperBoundDivergent = (M:NodeSingular, N:NodeSingular) =>
                siblings.get(M).map(indicators.get(N).sibling.div.upper).reduce((a, b) => a + b, 0)

            const lowerBoundDivergent = (M, N) =>
                siblings.get(M).map(indicators.get(N).sibling.div.lower).reduce((a, b) => a + b, 0)

            const upperBoundInvariant = (M, N) =>
                1 + siblings.get(M).map(indicators.get(N).sibling.inv.upper).reduce((a, b) => a + b, 0)

            const lowerBoundInvariant = (M, N) =>
                1 + siblings.get(M).map(indicators.get(N).sibling.inv.lower).reduce((a, b) => a + b, 0)

            const m = originSource
            const n = originTarget

            const upper = (1/2)*(
                upperBoundDivergent(m, n) / lowerBoundInvariant(m, n)
                + upperBoundDivergent(n, m) / lowerBoundInvariant(n, m)
            )
            const lower =
                lowerBoundDivergent(m, n)/(upperBoundInvariant(m, n)*(lowerBoundDivergent(m, n) + 1))
                + lowerBoundDivergent(n, m)/(upperBoundInvariant(n, m)*(lowerBoundDivergent(n, m) + 1))

            return {upper, lower}
        })()

        const cost =
            relabelCost * params.weightRelabel
            + (ancestryCost.lower + ancestryCost.upper) * params.weightAncestry / 2
            + (siblingCost.lower + siblingCost.upper) * params.weightSibling / 2

        edge.data('cost', cost)
        edge.data('costExplained', `${round(relabelCost)}, [${round(ancestryCost.lower)}, ${round(ancestryCost.upper)}], [${round(siblingCost.lower)}, ${round(siblingCost.upper)}] = ${round(cost)}`)
    }
    const computeEdgesCosts = (edges: cytoscape.EdgeCollection) => {
        if (edges.size() === 0)
            return 0
        edges.forEach(computeEdgeCost)
        const costSum = edges.map(e => e.data('cost')).reduce((acc, cur) => acc + cur)
        return costSum / edges.size()
    }

    const sortEdgesByIncreasingCost = (edges: cytoscape.EdgeCollection) => {
        return edges.sort((edge1, edge2) => edge1.data('cost') - edge2.data('cost'))
    }

    const fixEdge = (edges:cytoscape.EdgeCollection, edge:cytoscape.EdgeSingular) => {
        const incidentEdges = completeGraph.collection()
        const source = edge.source()
        const target = edge.target()
        if (source.data('noMatchNode') !== true)
            incidentEdges.merge(source.connectedEdges())
        if (target.data('noMatchNode') !== true)
            incidentEdges.merge(target.connectedEdges())

        incidentEdges.difference(edge).remove()
    }

    const selectEdgeToFix = (orderedEdges: cytoscape.EdgeCollection) => {
        let i = 0
        while (true) {
            const rand = Math.random()
            if (rand <= params.gamma)
                return orderedEdges[i]
            i = (i + 1) % orderedEdges.size()
        }
    }

    computeEdgesCosts(completeGraph.edges())
    let allEdges = completeGraph.edges()
    let proposedMatching = completeGraph.collection()

    const nextMatchingGenerator = (currentMatching:cytoscape.EdgeCollection) => {
        proposedMatching = completeGraph.collection()
        allEdges.restore()

        const nbMatchingsToKeep = pick(currentMatching.size(), 0)
        const map = shuffle(range(currentMatching.size()))
        for (let i = 0 ; i < nbMatchingsToKeep ; i++) {
            fixEdge(allEdges, currentMatching[map[i]])
            proposedMatching.merge(currentMatching[map[i]])
        }
        let i = 0
        while (i < 10*allEdges.size())
        {
            const nonSelectedEdgesLeft = allEdges.filter(':inside').difference(proposedMatching)
            computeEdgesCosts(nonSelectedEdgesLeft)
            if (nonSelectedEdgesLeft.size() <= 0)
                break
            const orderedSelectableEdges = sortEdgesByIncreasingCost(nonSelectedEdgesLeft)
            const edgeToFix = selectEdgeToFix(orderedSelectableEdges)
            fixEdge(allEdges, edgeToFix)
            proposedMatching.merge(edgeToFix)
            i++
        }

        return proposedMatching
    }

    const objectiveFunction = (matching:cytoscape.EdgeCollection) => Math.exp(-params.beta * computeEdgesCosts(matching))
    const initialMatching = nextMatchingGenerator(completeGraph.collection())

    const bestMatching = metropolisAlgorithm(initialMatching, nextMatchingGenerator, objectiveFunction, params.nbIteration)

    return <Match[]>bestMatching.map(edge => ({
        m: edge.source().data('originId'),
        n: edge.target().data('originId'),
        cost: edge.data('cost'),
        costExplained: edge.data('costExplained')
    }))
}
