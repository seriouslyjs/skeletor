# Skeletor - Directory Structure Creator
Skeletor is a CLI tool that creates files and directories based on a given configuration file in YAML format.
Create a `.skeletorrc` or another YAML file with the desired directory structure.

``` bash
skeletor # Automatically detect `.skeletorrc` file in the current directory:
```
``` bash
skeletor --input structure.yaml # Create directory structure from `structure.yaml` file:
```

**Options:**
- `--input <file>`: Path to the input YAML file describing the directory structure.
- `--help`: Display this help message.


**Configuration File Format:**
The configuration file should contain a `directories` key with nested objects representing directories and files.

Example `structure.yaml` (or `.skeletorrc`):

```yaml
directories:
  src:
    index.js: |
      console.log('Hello, world!');
    components:
      Header.js: |
        // Header component
      Footer.js: |
        // Footer component
  README.md: |
    # Project Title
    Description of the project.
```
**Notes:**
- The tool will create directories and files as specified in the configuration.
- Existing files and directories will not be overwritten unless specified.