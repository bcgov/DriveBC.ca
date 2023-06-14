# DriveBC public website

### <a name="pre-commit"></a>Pre commit hooks

Pre-commit hooks run various code formatters and linters. Some (black, prettier) will automatically reformat your code. If you're
using Visual Studio code with the recommended extensions, the pre commit hook formatting should match editor output.

1. Install [pre-commit](https://pre-commit.com/#install) (`brew install pre-commit` using homebrew)
2. Setup the pre-commit and commit message git hooks in the local repository: `pre-commit install --hook-type pre-commit --hook-type commit-msg`
