import {EdgeCollection, EdgeDefinition, ElementDefinition, NodeDefinition, StylesheetStyle} from "cytoscape";
import {flexible} from 'tree-matching'
import {tree1, tree2} from "./common";

const dagre = require("cytoscape-dagre")
const cytoscape = require("cytoscape");
export const generateId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const params : flexible.TreeMatchingParameters = {
    weightRelabel: 0.9,
    weightAncestry: 1,
    weightSibling: 0.4,
    weightNoMatch: 2,
    gamma: 0.7,
    beta: 1.6,
    nbIteration: 100
}

const test_cyto = () => {
    cytoscape.use( dagre );

    const t0 = performance.now()
    const matching : flexible.Match[] = flexible.matchTrees(params, flexible.relabelCosts.simpleLabel)(tree1, tree2)
    const t1 = performance.now()

    console.log('took: ' + (t1 - t0))

    console.log(matching)
    const combinedGraph = (() => {
        const getElementsDefinitionWithNewIds = (tree:cytoscape.Core) => {
            const treeIdMap = new Map()
            tree.nodes().forEach(node => {treeIdMap.set(node.id(), generateId())})

            const nodes = tree.nodes().reduce((result, node) => {
                const nodeDef = <NodeDefinition> {
                    group: 'nodes',
                    data: {
                        id: treeIdMap.get(node.id()),
                        value: node.data('value'),
                    }
                }
                const edgeDef = <EdgeDefinition> (node.parent().size() === 0 ? [] : {
                    group: 'edges',
                    data: {
                        id: generateId(),
                        source: treeIdMap.get(node.parent().first().id()),
                        target: treeIdMap.get(node.id())
                    }
                })

                return <ElementDefinition[]> [...result, nodeDef, edgeDef]
            }, [])

            return <[ElementDefinition[], Map<string, string>]> [nodes, treeIdMap]
        }
        const [elements1, treeIdMap1]  = getElementsDefinitionWithNewIds(tree1)
        const [elements2, treeIdMap2] = getElementsDefinitionWithNewIds(tree2)
        const newEdges = matching.map(({m, n, cost, costExplained}) => {
            return <EdgeDefinition>{
                group:'edges',
                data: {
                    id: generateId(),
                    source: treeIdMap1.get(m) || 'noMatch1',
                    target: treeIdMap2.get(n) || 'noMatch2',
                    matchingEdge: true,
                    cost: costExplained
                }
            }
        })

        const graph = cytoscape({
            container: document.getElementById('cy'), // container to render in
            elements: [...elements1, ...elements2, ...newEdges,
                {
                    group:'nodes',
                    data: {
                        id: 'noMatch1',
                        value: 'noMatch1'
                    }
                },
                {
                    group:'nodes',
                    data: {
                        id: 'noMatch2',
                        value: 'noMatch2'
                    }
                }
            ],
            style: <StylesheetStyle[]>[
                {
                    selector: 'node',
                    style: {
                        'label': 'data(value)',
                    }
                },
                {
                    selector: "edge[?matchingEdge]",
                    style: {
                        'line-color': 'red',
                        'width': 0.6,
                        'line-style': 'dashed',
                        'label': 'data(cost)',
                        'font-size': '4'
                    }
                },
            ],
            layout: {
                name: 'dagre'
            }
        })
        graph.elements().not('edge[?matchingEdge]').layout({
            name: 'dagre'
        }).run();

        return graph
    })()
}
test_cyto()
