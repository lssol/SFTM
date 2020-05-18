import {MongoClient, MongosOptions, ObjectId} from "mongodb";
import {DOMVersion} from "./types";
import {BTM, computeFTMCost, RTED} from "tree-matching";
import {domToCyTree} from "./dom";
import {avg, tokenize, tokenize2} from "./utils";

enum MatchingSolution {
    RTED,
    SFTM
}
const paramsRTED : RTED.TreeMatchingParameters = {
    relabelCost: 1,
    deletionCost: 1,
    insertionCost: 1,
    rtedApiUrl: "http://163.172.16.184:7040/"
}

const paramsBTM: BTM.BTMParams = {
    maxNumberOfNeighbors: 10,
    // limitNodesPerToken: n => Math.sqrt(n),
    limitNodesPerToken: n => Math.pow(n, 1),
    noMatchNodeCost: 0.25,
    gamma: 0.7,
    lambda:0.7,
    nbIterationsMetropolis: 100,
    propagationWeights: [0.3, 0.1]
    //propagationWeights: [0.6, 0.3, 0.1]
}

const settings = {
    mongodbConnectionString: "mongodb://localhost:27017",
    dbName: "locatorBenchmark",
    dbCollection: "DOMVersions",
}

const repository = async () => {
    let client = await MongoClient.connect(settings.mongodbConnectionString, {
        sslKey: 'datalake.ca.pem',
        sslValidate: false
    })
    let collection = client.db(settings.dbName).collection<DOMVersion>(settings.dbCollection)
    return {
        retrieveOriginals: async (limit:number) => collection.find({nbMutations: 0, url: 'linkedin.com'}).limit(limit),
        retrieveMutations: async (original: ObjectId) => collection.find({original: original})
    }
}

const retrieveWebsites = async () => {
    const repo          = await repository()
    const originals     = await repo.retrieveOriginals(1)
    const firstOriginal = await originals.next()
    const mutations     = await repo.retrieveMutations(firstOriginal._id)
    const mutationsArr = await mutations.toArray()

    mutationsArr.forEach(m => {
        console.log({
            url: m.url,
            nbMutations: m.nbMutations,
            size: m.content.length
        })
    })

    return {firstOriginal, mutationsArr}
}

const computeSignatures = (tree:cytoscape.Core) => {
    const signatures = new Map<string, string>()
    tree.nodes().forEach(node => {
        signatures.set(node.id(), node.data('signature'))
    })

    return signatures
}

(async () => {
    const {firstOriginal, mutationsArr: mutations} = await retrieveWebsites()
    const tree1 = domToCyTree(tokenize2)(firstOriginal.content)
    const mutatedTrees = mutations.map(mutation => domToCyTree(tokenize2)(mutation.content))

    const signatures1 = computeSignatures(tree1)
    const mutatedSignatures = mutatedTrees.map(computeSignatures)

    const computeEfficiency = (matching, signature) => {
        const NOMATCH = "NO_MATCH_NODE"
        matching.forEach(match => {
            if (match.id1 == NOMATCH)
                match.id1 = null
            if (match.id2 == NOMATCH)
                match.id2 = null
        })
        const mismatched = matching
            .filter(({id1, id2}) => id1 != null && id2 != null && signatures1.get(id1) != signature.get(id2))
        const notMatch = matching.filter(({id1, id2}) => id1 == null || id2 == null)
        const percentageMismatch = 100 * mismatched.length / matching.length
        const percentageNoMatch = 100 * notMatch.length / matching.length

        return {percentageMismatch, percentageNoMatch}
        // const humanReadableMatchings = mismatched.map(matching => ({
        //     values1: tree1.$id(matching.id1).data('value') != null ? tree1.$id(matching.id1).data('value').join(' ') : null,
        //     values2: tree2.$id(matching.id2).data('value') != null ? tree2.$id(matching.id2).data('value').join(' ') : null,
        // }))
        // console.log()
    }

    const run = (solution:MatchingSolution) => async (pow) => {
        paramsBTM.limitNodesPerToken = n => Math.pow(n, pow)
        let matchings = solution == MatchingSolution.SFTM
            ? await Promise.all(mutatedTrees.map(mutatedTree => BTM.matchTrees(paramsBTM)(tree1, mutatedTree)))
            : await Promise.all(mutatedTrees.map(mutatedTree => RTED.matchTrees(paramsRTED)(tree1, mutatedTree)))
        let efficiencies = matchings.map((matching, index) => computeEfficiency(matching.matching, mutatedSignatures[index]))

        let averageMismatch = avg(efficiencies.map(e => e.percentageMismatch))
        let averageNoMatch = avg(efficiencies.map(e => e.percentageNoMatch))
        let averageSuccess = avg(efficiencies.map(e => 100 - (e.percentageNoMatch + e.percentageMismatch)))

        let result = {
            pow: pow,
            url: firstOriginal.url,
            avgNumberOfMutation: avg(mutations.map(m => m.nbMutations)),
            nbNodes: tree1.elements().length,
            avgTime: avg(matchings.map(m => m.time)),
            averageMismatch,
            averageNoMatch,
            averageSuccess,
        }
        console.log(result)
    }
    //await run(MatchingSolution.RTED)(0)
    await run(MatchingSolution.SFTM)(1)
    // for (let p of [0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.55, 0.65, 0.7, 0.75, 0.8])
    //     await run(p)

    // CALCULATING FTM COSTS
    // const weights = {sibling:1, ancestors:1, relabel:1, noMatch: 1}
    // const costFTM_BTM = computeFTMCost(tree1, tree2, {matching:matchingBTM, distance:0, time:9}, weights)
    // const costFTM_RTED = computeFTMCost(tree1, tree2, {matching:matchingRTED, distance:0, time:9}, weights)

    // console.log(costFTM_BTM)
    // console.log(costFTM_RTED)
})()
