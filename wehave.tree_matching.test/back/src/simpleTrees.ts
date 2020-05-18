import {flexible, BTM, computeFTMCost, Weights} from 'tree-matching'
import cytoscape = require("cytoscape");

// const params : flexible.TreeMatchingParameters = {
//     weightRelabel: 0.9,
//     weightAncestry: 1,
//     weightSibling: 0.4,
//     weightNoMatch: 2,
//     gamma: 0.7,
//     beta: 1.6,
//     nbIteration: 100
// }

const params: BTM.BTMParams = {
    maxNumberOfNeighbors: 5,
    limitNodesPerToken: n => 100*Math.sqrt(n),
    noMatchNodeCost: 10,
    gamma: 0.7,
    lambda: 1,
    nbIterationsMetropolis: 100,
    propagationWeights: [0.6, 0,3, 0,1]
}

const tree1 = cytoscape({
    elements: [
        {group:'nodes', data: { id: 'a', label: 'a', value: ['a']}},
        {group:'nodes', data: { id: 'b', label: 'b', value: ['b'], parent: 'a'}},
        {group:'nodes', data: { id: 'c', label: 'c', value: ['c'], parent: 'b'}},
        {group:'nodes', data: { id: 'c2', label: 'c', value: ['c'], parent: 'b' }},
        {group:'nodes', data: { id: 'd', label: 'd c', value: ['d', 'c'], parent: 'a' }},
        {group:'nodes', data: { id: 'f', label: 'f', value: ['f'], parent: 'd' }},
        {group:'nodes', data: { id: 'f2', label: 'f', value: ['f'], parent: 'd' }},
        {group:'nodes', data: { id: 'g', label: 'g', value: ['g'], parent: 'd' }},
    ],
})
const tree1_bis = cytoscape({
    elements: [
        {group:'nodes', data: { id: 'ta', label: 'a', value: ['a']}},
        {group:'nodes', data: { id: 'tb', label: 'b', value: ['b'], parent: 'ta'}},
        {group:'nodes', data: { id: 'tc', label: 'c', value: ['c'], parent: 'tb'}},
        {group:'nodes', data: { id: 'tc2', label: 'c', value: ['c'], parent: 'tb' }},
        {group:'nodes', data: { id: 'td', label: 'd', value: ['d'], parent: 'ta' }},
        {group:'nodes', data: { id: 'tf', label: 'f', value: ['f'], parent: 'td' }},
        {group:'nodes', data: { id: 'tf2', label: 'f', value: ['f'], parent: 'td' }},
        {group:'nodes', data: { id: 'tg', label: 'g', value: ['g'], parent: 'td' }},
        {group:'nodes', data: { id: 'tt', label: 't', value: ['t'], parent: 'td' }},
        {group:'nodes', data: { id: 'tt2', label: 't', value: ['t'], parent: 'td' }},
    ],
})
const tree2 = cytoscape({
    elements: [
        {group:'nodes', data: { id: 'a', label: 'a'}},
        {group:'nodes', data: { id: 'b', label: 'b', parent: 'a'}},
        {group:'nodes', data: { id: 'c', label: 'c', parent: 'b'}},
        {group:'nodes', data: { id: 'c2', label: 'c', parent: 'b' }},
        {group:'nodes', data: { id: 'd', label: 'd', parent: 'a' }},
        {group:'nodes', data: { id: 'f', label: 'f', parent: 'd' }},
        {group:'nodes', data: { id: 'f2', label: 'f', parent: 'd' }},
        {group:'nodes', data: { id: 'g', label: 'g', parent: 'd' }},
    ],
})
//
// const t0 = new Date()
// const matching : flexible.Match[] = flexible.matchTrees(params, flexible.relabelCosts.simpleLabel)(tree1, tree2)
// const t1 = new Date()

const t0 = new Date()
const matching = BTM.matchTrees(params)(tree1, tree1_bis)
const t1 = new Date()

console.log('Matching took:' + (t1.getTime() - t0.getTime()))
console.log(matching)

const cost = computeFTMCost(tree1, tree1_bis, matching, {sibling:1, ancestors:1, relabel:1, noMatch: 1})
console.log(cost)
