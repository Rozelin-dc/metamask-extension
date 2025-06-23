/// <reference path="../util/type.js" />

const crypto = require('crypto');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');
const yargs = require('yargs');

const {
  TEST_ID_ATTRIBUTE_NAME,
  RECORD_ACTION_PROP_NAMES,
} = require('../util/constant');
const { readFile, writeFile } = require('../util/file');
const { getAst } = require('../util/getAst');

const argv = await yargs(process.argv.slice(2))
  .options({
    file: {
      demandOption: true,
      string: true,
    },
    projectRootDir: {
      demandOption: true,
      string: true,
    },
    mapFileDir: {
      demandOption: true,
      string: true,
    },
  })
  .parse();

const fileName = argv.file;
const projectRootDir = argv.projectRootDir;
const mapFileDir = argv.mapFileDir;
const idMapFileName = `${fileName.replace(
  projectRootDir,
  mapFileDir,
)}.id-map.json`;
const idMapFile = await readFile(idMapFileName, true);

const ast = await getAst(fileName);

/** @type {IdMap} */
const idMap = idMapFile ? JSON.parse(idMapFile) : {};
traverse(ast, {
  enter(path) {
    if (path.isJSXOpeningElement()) {
      if (!idMap[path.node.start]) {
        // If ID is missing, create a new one.
        idMap[path.node.start] = {
          position: path.node.start,
          id: crypto.randomUUID(),
        };
      }

      // Embed ID in JSXOpeningElement.
      path.node.attributes.push(
        t.jSXAttribute(
          t.jSXIdentifier(TEST_ID_ATTRIBUTE_NAME),
          t.stringLiteral(idMap[path.node.start].id),
        ),
      );
    }

    if (path.isJSXAttribute()) {
      /** @type {string} */
      const propName = path.node.name.name;
      if (!RECORD_ACTION_PROP_NAMES[propName]) {
        return;
      }

      if (!idMap[path.node.start]) {
        // If data is missing, create a new one.
        const parentNode = path.parent;
        const parentNodeId = idMap[parentNode.start].id;
        if (!parentNodeId) {
          throw new Error('Parent node ID is missing.');
        }

        idMap[path.node.start] = {
          position: path.node.start,
          propName: propName,
          parentNodeId,
        };
      }

      if (idMap[path.node.start].prevParentNodeId) {
        // Embed ID in JSXOpeningElement.
        const parent = path.parentPath;
        if (!parent.isJSXOpeningElement()) {
          throw new Error('Parent is not JSXOpeningElement.');
        }
        parent.node.attributes.push(
          t.jSXAttribute(
            t.jSXIdentifier(
              `${TEST_ID_ATTRIBUTE_NAME}-for-action-${RECORD_ACTION_PROP_NAMES[propName]}`,
            ),
            t.stringLiteral(idMap[path.node.start].prevParentNodeId),
          ),
        );
      }
    }
  },
});

const newCode = generate(ast).code;

// Overwrite ID map file.
writeFile(idMapFileName, JSON.stringify(idMap, null, 2));

// Overwrite the original file.
writeFile(fileName, newCode);
