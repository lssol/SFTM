const cytoscape = require("cytoscape");

export const tree1 = cytoscape({
    elements: [
        {group:'nodes', data: { id: 'a', value: 'a'}},
        {group:'nodes', data: { id: 'b', value: 'b', parent: 'a'}},
        {group:'nodes', data: { id: 'c', value: 'c', parent: 'b'}},
        {group:'nodes', data: { id: 'c2', value: 'c', parent: 'b' }},
        {group:'nodes', data: { id: 'd', value: 'd', parent: 'a' }},
        {group:'nodes', data: { id: 'f', value: 'f', parent: 'd' }},
        {group:'nodes', data: { id: 'f2', value: 'f', parent: 'd' }},
        {group:'nodes', data: { id: 'g', value: 'g', parent: 'd' }},
    ],
})
export const tree2 = cytoscape({
    elements: [
        {group:'nodes', data: { id: 'a', value: 'a'}},
        {group:'nodes', data: { id: 'g', value: 'g', parent: 'a'}},
        {group:'nodes', data: { id: 'd', value: 'd', parent: 'a'}},
        {group:'nodes', data: { id: 'b', value: 'b', parent: 'a'}},
        {group:'nodes', data: { id: 'c', value: 'c', parent: 'b'}},
        {group:'nodes', data: { id: 'c2', value: 'c', parent: 'b' }},
        {group:'nodes', data: { id: 'c3', value: 'c', parent: 'b' }},
        {group:'nodes', data: { id: 'f', value: 'f', parent: 'c' }},
        {group:'nodes', data: { id: 'f2', value: 'f', parent: 'c' }},
        {group:'nodes', data: { id: 'f3', value: 'f', parent: 'c' }},
    ],
})
