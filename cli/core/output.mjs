export function createOutput({ out = process.stdout, err = process.stderr } = {}) {
  return {
    info(message = "") {
      out.write(`${message}\n`);
    },
    error(message = "") {
      err.write(`${message}\n`);
    },
    section(title) {
      out.write(`${title}\n`);
      out.write(`${"=".repeat(title.length)}\n`);
    },
  };
}
