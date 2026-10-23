import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, type EnrolledUser } from "./session";

/** For pages: send the user wherever their state requires, else return them. */
export async function requireEnrolledUser(): Promise<EnrolledUser> {
  const user = await getCurrentUser();
  if (user.status === "unauthenticated") redirect("/login");
  if (user.status === "unenrolled") redirect("/unenrolled");
  if (user.mustChangePassword) redirect("/change-password");
  return user;
}
