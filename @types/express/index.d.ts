/**
 * Extending the properties of `Request` interface by using `Declaration Merging`
 *
 * 💡
 * https://www.typescriptlang.org/docs/handbook/declaration-merging.html
 * Declaration Merging is a feature of TypeScript that allows you to combine multiple
 * declaration of the same name into one. This is usedful when you want to extend
 * the properties of an interface OR add new properties to an interface.
 *
 * ❌ Wrong approach:
 * Creating an interface with extending `Request` would work in the controllers but it
 * will give error while working with router. Also code can be repeated for just having
 * same properties in Request. So using `Declaration Merging` is the right approach.
 *
 * Below is a `Stackoverflow` post that has lots of solutions, some of them are out-dated
 * but the one used for this project works fine as of now.
 * https://stackoverflow.com/questions/37377731/extend-express-request-object-using-typescript
 *
 * 🪜 Steps to extend Express interface properties:
 * 1. Create folder `${PROJECT_ROOT}/@types/express/index.d.ts`
 * 2. Add what's added below in that file (the code)
 * 3. Inside `tsconfig.json` add / merge the property such that: {"compilerOptions": "typeRoots": [ "@types" ] }
 *
 * 📝 Note:
 * - This code does give error at first while using `Express` types
 */

import { DocumentType } from "@typegoose/typegoose";

import { CourseClass } from "../../src/models/course.model";
import { UserSchema } from "../../src/models/user.schema";

declare module "express-serve-static-core" {
  interface Request {
    user?: DocumentType<UserSchema>;
    course?: DocumentType<CourseClass>;
  }
}
