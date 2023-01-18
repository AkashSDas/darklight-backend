import { prop } from "@typegoose/typegoose";
import { SchemaTypes } from "mongoose";

export class ImageClass {
  @prop({ type: SchemaTypes.String })
  id?: string;

  @prop({ type: SchemaTypes.String, required: true })
  URL: string;
}
