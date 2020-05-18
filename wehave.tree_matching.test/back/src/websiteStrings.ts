import {BTM, flexible, RTED} from "tree-matching";
import {NodeDefinition} from "cytoscape";
import {elemToString, generateId, tokenize, tokenize2} from "./utils";
import fs from 'fs'
import {domToCyTree} from "./dom";
import {performance} from 'perf_hooks'
import {relabelCosts} from "tree-matching/dist/flexible";

const params: BTM.BTMParams = {
    maxNumberOfNeighbors: 50,
    limitNodesPerToken: n => 100*Math.sqrt(n),
    noMatchNodeCost: 0.01,
    gamma: 0.60,
    lambda: 1,
    nbIterationsMetropolis: 500,
    propagationWeights: [0.6, 0.3, 0.1]
}
const paramsFTM : flexible.TreeMatchingParameters = {
    weightRelabel: 0.9,
    weightAncestry: 1,
    weightSibling: 0.4,
    weightNoMatch: 2,
    gamma: 0.7,
    beta: 1.6,
    nbIteration: 100
}

const paramsRTED : RTED.TreeMatchingParameters = {
    relabelCost: 0.7,
    deletionCost: 1,
    insertionCost: 1,
    rtedApiUrl: "http://localhost:7000"
}

const getHTML = (path:string) => {
    return new Promise<string>((resolve, reject) => {
        fs.readFile(path, 'utf8', (err, data) => {
            console.log(err)
            resolve(data)
        })
    })
}

(async () => {
    const pathOriginal = 'res/test.html'
    const pathEvolution = 'res/test.html'
    const htmlOriginal = await getHTML(pathOriginal)
    const htmlEvolution = await getHTML(pathEvolution)
    const treeOriginal = domToCyTree(tokenize2)(htmlOriginal)
    const treeEvolution = domToCyTree(tokenize2)(htmlEvolution)
console.log('number of nodes' + treeOriginal.nodes().size())
    
    const measureBTM = () => {
        const t0 = performance.now()
        BTM.matchTrees(params)(treeOriginal, treeEvolution)
        const t1 = performance.now()
        return t1 - t0
    }
    const measureFTM = () => {
        const t0 = performance.now()
        flexible.matchTrees(paramsFTM, relabelCosts.countSameWords)(treeOriginal, treeEvolution)
        const t1 = performance.now()
        return t1 - t0
    }
    const measureRTED = async () => {
        const t0 = performance.now()
        await RTED.matchTrees(paramsRTED)(treeOriginal, treeEvolution)
        const t1 = performance.now()

        return t1 - t0
    }

    // const ftmTime  = measureFTM()
    // console.log('FTM Matched in: ' + ftmTime)

    const btmTime  = measureBTM()
    console.log('BTM Matched in: ' + btmTime)

    const rtedTime = await measureRTED()
    console.log('RTED Matched in: ' + rtedTime)
})()
