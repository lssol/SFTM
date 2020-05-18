import { ObjectID } from "bson";

export type DOMVersion = {
    _id: ObjectID,
    url: string,
    content: string,
    original: ObjectID,
    nbMutations: number,
    mutationsMade: MutationMade[]
}
export enum MutationCategory {
    Structure = 'Structure',
    Attribute = 'Attribute',
    Content   = 'Content'
}

export enum MutationType {
    Attr_DeleteWholeAttribute = 'Attr_DeleteWholeAttribute',
    Attr_DeleteOneWord        = 'Attr_DeleteOneWord',
    Attr_ChangeOneLetter      = 'Attr_ChangeOneLetter',

    Struct_Duplicate = 'Struct_Duplicate',
    Struct_Swap      = 'Struct_Swap',
    Struct_Remove    = 'Struct_Remove',
    Struct_Wrap      = 'Struct_Wrap',
    Struct_Unwrap    = 'Struct_Unwrap',

    Content_Remove        = 'Content_RemoveLetters',
    Content_ChangeLetters = 'Content_Change',
    Content_RemoveTokens  = 'Content_RemoveWords',
    Content_Replace       = 'Content_Replace'
}

export const MutationTypeCategories = new Map<MutationType, MutationCategory>([
    [MutationType.Attr_DeleteWholeAttribute, MutationCategory.Attribute],
    [MutationType.Attr_ChangeOneLetter, MutationCategory.Attribute],
    [MutationType.Attr_DeleteOneWord, MutationCategory.Attribute],

    [MutationType.Struct_Duplicate, MutationCategory.Structure],
    [MutationType.Struct_Remove, MutationCategory.Structure],
    [MutationType.Struct_Swap, MutationCategory.Structure],
    [MutationType.Struct_Wrap, MutationCategory.Structure],
    [MutationType.Struct_Unwrap, MutationCategory.Structure],

    [MutationType.Content_ChangeLetters, MutationCategory.Content],
    [MutationType.Content_Remove, MutationCategory.Content],
    [MutationType.Content_RemoveTokens, MutationCategory.Content],
    [MutationType.Content_Replace, MutationCategory.Content],
])

export const RecursiveMutationTypes = [
    MutationType.Struct_Duplicate
]

export type Mutater = (getNextRandomElement: () => Element) => MutationMade[]

export type ShortAttribute = {
    attributeName: string,
    attributeValue: string
}

export type ShortElement = {
    tagName: string,
    outerHTML: string,
    attributes: ShortAttribute[]
}

export type MutationMade = {
    MutationType:       MutationType,
    MutationCategory:   MutationCategory,
    AttributeConcerned: ShortAttribute,
    ElementConcerned: ShortElement,
}
