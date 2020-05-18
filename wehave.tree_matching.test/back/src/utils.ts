export const generateId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
export const attrToString = (attr:Attr) => attr.name === 'signature' ? '' : `${attr.name} ${attr.value} ${attr.value}` // Twice to give more importance
export const elemToString = (elem:Element) => `${elem.tagName} ${Array.from(elem.attributes).map(attrToString).join(' ')}`
export const tokenize = (str:string) => str.replace(/[\W_]+/g," ").split(' ')
export const tokenize2 = (str:string) => str.replace(/["= ]/g," ").split(' ')
export const getSiblingIndex = (element:Element) => {
    if (element.parentElement == null)
        return null
    const siblingsWithSameNodeName = Array.from(element.parentElement.children).filter(el => el.nodeName === element.nodeName)
    if (siblingsWithSameNodeName.length <= 1)
        return null
    return Array.from(siblingsWithSameNodeName).findIndex(el => el === element)
}

export const getXPath : (node:Element) => string = node => {
    if (node == null)
        return '';
    let siblingIndex = getSiblingIndex(node)
    return `${node.nodeName}${siblingIndex == null ? '' : '['+siblingIndex+']'}/${getXPath(node.parentElement)}`;
};
export const sum = (list:number[]) => {
    let sum = 0
    list.forEach(i => {sum += i})

    return sum
}
export const avg = (list:number[]) => {
    return sum(list) / list.length
}
