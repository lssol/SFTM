import {NodeSingular} from 'cytoscape'

export const shuffle = <T>(array:Array<T>) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    
    return array
}
export const range = (n:number) => <Array<number>>[...Array(n).keys()]
export const pick = (max: number, min = 1) => {
    if (max === min)
        return max
    const toppedMax = max - 0.0001
    return Math.floor(Math.random() * (toppedMax - min) + min);
}
export const round = (n:number, digits:number = 1) => {
    const power = Math.pow(10, digits)

    return Math.round(n*power)/power
}
export const generateId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
export const metropolisAlgorithm = <Point>(
    initialPoint: Point,
    nextPointGenerator: (currentPoint:Point) => Point,
    objectiveFunction: (point:Point) => number,
    nbIterations: number
) => {
    let currentPoint = initialPoint
    let currentObjectiveValue = objectiveFunction(currentPoint)

    let maxObjectiveValue = currentObjectiveValue
    let bestPoint = currentPoint

    for (let i = 0 ; i < nbIterations ; i++)
    {
        const suggestedPoint                   = nextPointGenerator(currentPoint)
        const objectiveValueWithSuggestedPoint = objectiveFunction(suggestedPoint)
        const acceptanceRatio = objectiveValueWithSuggestedPoint / currentObjectiveValue
        const randomNumber    = Math.random()

        if (randomNumber <= acceptanceRatio) { // ACCEPT Candidate
            currentPoint = suggestedPoint
            currentObjectiveValue = objectiveValueWithSuggestedPoint
            if (currentObjectiveValue > maxObjectiveValue) {
                maxObjectiveValue = currentObjectiveValue
                bestPoint = currentPoint
            }
        }
    }

    return bestPoint
}
export const addX = <T>(map:Map<T, number>, key: T, x:number) => {
    map.set(key, map.has(key) ? map.get(key) + x : x)
}
export const pushAt = <T, V>(map: Map<T, Set<V>>, key: T, values: Set<V>) => {
    if (map.has(key))
        values.forEach(val => map.get(key).add(val))
    else
        map.set(key, new Set(values))
}
