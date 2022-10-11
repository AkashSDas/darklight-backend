// ===============================
// Enums
// ===============================

import { SchemaTypes } from "mongoose";

import { prop } from "@typegoose/typegoose";

export enum EditorContentType {
  H1 = "h1",
  H2 = "h2",
  H3 = "h3",
  Callout = "callout",
  Paragraph = "paragraph",
  Code = "code",
  Image = "image",
  Quote = "quote",
  Divider = "divider",
  UnorderedList = "unordered-list",
  OrderedList = "ordered-list",
}

class TContentDataClass {
  @prop({ required: true })
  key: string;

  @prop({ required: true })
  value: string;
}

export class TEditorContentClass {
  @prop({ type: SchemaTypes.String, required: true, enum: EditorContentType })
  type: EditorContentType;

  @prop({ type: () => SchemaTypes.Array })
  data?: TContentDataClass[];
}
