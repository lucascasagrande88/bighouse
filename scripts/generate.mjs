// Content source: data/projects.json + data/artworks.json.
// Committed HTML is the deploy artifact; this wrapper regenerates all routes.
import {spawnSync} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const result=spawnSync('python3',[resolve(root,'scripts/generate.py')],{cwd:root,stdio:'inherit'});
if(result.error)throw result.error;
process.exit(result.status??1);
