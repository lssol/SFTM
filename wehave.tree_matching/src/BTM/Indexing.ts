import {NodeCollection} from "cytoscape";

export type Index = Map<string, Set<string>>
export type Indices = {
    valueIndex: Index,
    xPathIndex: Index
}

const buildIndex = () => {
    const index = new Map<string, Set<string>>()
    return {
        add: (docId:string, tokens:string[]) => {
            tokens.forEach(token => {
                if (!index.has(token))
                    index.set(token, new Set([docId]))
                else
                    index.get(token).add(docId)
            })
        },
        getIndex: () => index
    }
}

const limitSizeIndex = (limit:number) => (index: Index) => {
    const result = new Map()
    index.forEach((docs, token) => {
        if (docs.size <= limit)
            result.set(token, docs)
    })

    return result
}

export const getIndex = (nodes:NodeCollection, limit: (n:number) => number) => {
    const xPathIndexBuilder = buildIndex()
    const valueIndexBuilder = buildIndex()
    nodes.forEach(node => {
        valueIndexBuilder.add(node.id(), node.data('value'))
        xPathIndexBuilder.add(node.id(), [node.data('xPath')])
    })

    const logNLimiter = limitSizeIndex(limit(nodes.size()))

    const valueIndex = logNLimiter(valueIndexBuilder.getIndex())
    const xPathIndex = logNLimiter(xPathIndexBuilder.getIndex())

    return <Indices>{
        valueIndex: valueIndex,
        xPathIndex: xPathIndex
    }
}
