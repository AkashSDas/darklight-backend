import { prop } from "@typegoose/typegoose";
import mongoose, { SchemaTypes } from "mongoose";

export enum ContentType {
  PARAGRAPH = "paragraph",
  IMAGE = "image",
  H1 = "h1",
  H2 = "h2",
  H3 = "h3",
  DIVIDER = "divider",
  QUOTE = "quote",
  CODE = "code",
}

class ContentDataClass {
  @prop({ required: true })
  key: string;

  @prop({ required: true })
  value: string;
}

export class ContentClass {
  @prop({
    default: () => new mongoose.Types.ObjectId(),
    type: SchemaTypes.String,
    required: true,
    immutable: true,
  })
  id: string;

  @prop({ type: SchemaTypes.String, required: true, enum: ContentType })
  type: ContentType;

  @prop({ type: () => SchemaTypes.Array })
  data: ContentDataClass[];
}
