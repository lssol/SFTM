import { ObjectID } from "bson";
export declare type DOMVersion = {
    _id: ObjectID;
    url: string;
    content: string;
    original: ObjectID;
    nbMutations: number;
    mutationsMade: MutationMade[];
};
export declare enum MutationCategory {
    Structure = "Structure",
    Attribute = "Attribute",
    Content = "Content"
}
export declare enum MutationType {
    Attr_DeleteWholeAttribute = "Attr_DeleteWholeAttribute",
    Attr_DeleteOneWord = "Attr_DeleteOneWord",
    Attr_ChangeOneLetter = "Attr_ChangeOneLetter",
    Struct_Duplicate = "Struct_Duplicate",
    Struct_Swap = "Struct_Swap",
    Struct_Remove = "Struct_Remove",
    Struct_Wrap = "Struct_Wrap",
    Struct_Unwrap = "Struct_Unwrap",
    Content_Remove = "Content_RemoveLetters",
    Content_ChangeLetters = "Content_Change",
    Content_RemoveTokens = "Content_RemoveWords",
    Content_Replace = "Content_Replace"
}
export declare const MutationTypeCategories: Map<MutationType, MutationCategory>;
export declare const RecursiveMutationTypes: MutationType[];
export declare type Mutater = (getNextRandomElement: () => Element) => MutationMade[];
export declare type ShortAttribute = {
    attributeName: string;
    attributeValue: string;
};
export declare type ShortElement = {
    tagName: string;
    outerHTML: string;
    attributes: ShortAttribute[];
};
export declare type MutationMade = {
    MutationType: MutationType;
    MutationCategory: MutationCategory;
    AttributeConcerned: ShortAttribute;
    ElementConcerned: ShortElement;
};
