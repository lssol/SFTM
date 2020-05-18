export type Matching = {
    time: number,
    distance: number,
    matching: {id1:string, id2:string}[]
}

export type FTMCost = {
    relabel: number,
    ancestry: number,
    sibling: number,
    nomatch: number,
    totalCost: number
}
