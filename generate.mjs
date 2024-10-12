import fs from 'fs';

// Simple random string generator for content
function generateRandomString(length = 10) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
}

// Generate content for each file
function generateFileContent() {
  return `// Generated file\n// Random data: ${generateRandomString(20)}\n`;
}

// Generate directory structure
function generateDirectoryStructure(depth = 5, breadth = 10) {
  const structure = {};

  for (let i = 0; i < breadth; i++) {
    let currentLevel = structure;
    for (let j = 0; j < depth; j++) {
      const dirName = `dir_${i}_${j}`;
      if (!currentLevel[dirName]) {
        currentLevel[dirName] = {};
      }
      currentLevel = currentLevel[dirName];
      currentLevel[`file_${i}_${j}.js`] = generateFileContent();
    }
  }

  return structure;
}

// Convert object to properly formatted YAML with block strings
function toYAMLBlock(structure, indent = 2) {
  function processObject(obj, level = 1) {
    return Object.entries(obj)
      .map(([key, value]) => {
        const indentation = ' '.repeat(level * indent);
        if (typeof value === 'object') {
          return `${indentation}${key}:\n${processObject(value, level + 1)}`;
        } else {
          // Use block style `|` for multiline file content
          const contentIndent = ' '.repeat((level + 1) * indent);
          return `${indentation}${key}: |\n${contentIndent}${value.split('\n').join(`\n${contentIndent}`)}`;
        }
      })
      .join('\n');
  }

  return processObject(structure);
}

// Write the YAML structure to a file
function writeYAMLFile(structure, filename = './fixtures/100k.yml') {
  const yamlContent = `directories:\n${toYAMLBlock(structure, 2)}`; // Ensure proper indentation for root-level 'directories'
  fs.writeFileSync(filename, yamlContent);
}

const largeStructure = generateDirectoryStructure(10, 100); // Adjust depth and breadth for larger numbers
writeYAMLFile(largeStructure);
console.log('Large .skeletorrc file generated with proper YAML formatting');
