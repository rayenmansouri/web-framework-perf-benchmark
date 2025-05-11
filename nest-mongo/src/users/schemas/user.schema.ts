import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: false })
  name: string;

  @Prop({ required: false, unique: false })
  username: string;

}

export const UserSchema = SchemaFactory.createForClass(User); 