import {EdgeCollection, EdgeDefinition, ElementDefinition, NodeDefinition, StylesheetStyle} from "cytoscape";
import {RTED} from 'tree-matching'
import {tree1, tree2} from "./common";

const dagre = require("cytoscape-dagre")
const cytoscape = require("cytoscape");
const generateId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const params : RTED.TreeMatchingParameters = {
    relabelCost: 2,
    deletionCost: 1,
    insertionCost: 1,
    rtedApiUrl: "http://localhost:7000"
}

const test_cyto = async () => {
    cytoscape.use( dagre );
    console.log('PARAMS')
    console.log(params)
    const t0 = performance.now()
    const {distance, matching} = await RTED.matchTrees(params)(tree1, tree2)
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
        const newEdges = matching.map(({id1, id2}) => {
            return <EdgeDefinition>{
                group:'edges',
                data: {
                    id: generateId(),
                    source: treeIdMap1.get(id1) || 'noMatch1',
                    target: treeIdMap2.get(id2) || 'noMatch2',
                    matchingEdge: true,
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
