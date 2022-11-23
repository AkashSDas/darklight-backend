import { prop } from "@typegoose/typegoose";
import mongoose, { SchemaTypes } from "mongoose";

enum ContentType {
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
