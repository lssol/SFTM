import cytoscape from "cytoscape"
import {EdgeSingular, ElementDefinition, NodeCollection, NodeDefinition, NodeSingular} from "cytoscape";
import {JSDOM} from 'jsdom'
import {elemToString, generateId, getXPath,} from "./utils";

export const domToCyTree = (toValue: (s:string) => any) => (dom:string) => {
    const elements : NodeDefinition[] = []

    const copy = (elem:Element, parent:string) => {
        const newId = generateId()
        elements.push(<NodeDefinition>{
            group: "nodes",
            data: {
                id: newId,
                value: toValue(elemToString(elem)),
                parent: parent,
                signature: elem.attributes.getNamedItem('signature') != null ? elem.attributes.getNamedItem('signature').value : null,
                xPath: getXPath(elem)
            }
        })
        Array.from(elem.children).forEach(child => copy(child, newId))
    }
    const root = new JSDOM(dom).window.document.documentElement
    copy(root, null)

    return cytoscape({elements: elements})
}
