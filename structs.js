import * as s from "superstruct";
import isEmail from "is-email";

export const CreateUser = s.object({
  email: s.define("Email", isEmail),
  firstName: s.size(s.string(), 1, 30),
  lastName: s.size(s.string(), 1, 30),
  address: s.string(),
});

// CreateUser의 일부면 괜찮다는 뜻
export const PatchUser = s.partial(CreateUser);
