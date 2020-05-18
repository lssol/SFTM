export const relabelCosts = {
    simpleLabel: (label1:string, label2:string) => {
        if (label1 === label2)
            return 0
        else
            return 1
    },
    countSameWords: (words1:string[], words2:string[]) => {
        const visitedWords = new Set<string>(words1)
        const commonWords  = words2.reduce((count, word) => visitedWords.has(word) ? count + 1 : count, 0)
        const minLength    = Math.max(words1.length, words2.length)

        return 1 - commonWords / minLength
    }
}
