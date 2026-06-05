import multer from "multer";
import path from "path";
import fs from "fs";

const workspaceRoot = process.cwd().endsWith(path.join("artifacts", "api-server"))
  ? path.resolve(process.cwd(), "../..")
  : process.cwd();

export const uploadsBase = path.resolve(workspaceRoot, "artifacts/api-server/uploads");

export function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

ensureDir(uploadsBase);

export function createUpload(subDir: string) {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.resolve(uploadsBase, subDir);
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `${unique}${ext}`);
    },
  });
  return multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });
}

export function fileToUrl(filePath: string): string {
  const rel = path.relative(uploadsBase, filePath);
  return `/api/uploads/${rel.replace(/\\/g, "/")}`;
}
