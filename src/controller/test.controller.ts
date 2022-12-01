import { Request, Response } from "express";

export function testController(_req: Request, res: Response) {
  return res.status(200).json({ message: "🪖 Testing" });
}
