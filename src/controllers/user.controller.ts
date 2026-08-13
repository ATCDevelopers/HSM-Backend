import type {Response, Request} from "express";

const userDemo = (req: Request, res: Response   ) => {
    res.status(200).json({ message: "User demo route is working!" });   
}

export default userDemo ;