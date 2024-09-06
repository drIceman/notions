importScripts(
  '//unpkg.com/@isomorphic-git/lightning-fs',
  '//unpkg.com/isomorphic-git@beta',
  '//unpkg.com/isomorphic-git@beta/http/web/index.umd.js',
  '//unpkg.com/magic-portal',
);

let fs = new LightningFS('notions');
const portal = new MagicPortal(self);

(async () => {
  let mainThread = await portal.get('mainThread');
  let dir = '/';

  portal.set('workerThread', {
    setDir: async _dir => {
      dir = _dir;
    },
    files: async => {
      return git.listFiles({ fs, dir });
    },
    read: async fileName => {
      return fs.promises.readFile(dir + fileName, { encoding: 'utf8' });
    },
    save: async (fileName, content) => {
      return fs.promises.writeFile(dir + fileName, content);
    },
    push: async => {
      git.add({ fs, dir, filepath: '.' });
      git.commit({ fs, dir, author: { name: 'notions', email: '' }, message: new Date().toISOString() });
      git.push({
        http: GitHttp,
        fs,
        dir,
        onAuth(url) {
          return mainThread.fill(url);
        },
        onAuthFailure({ url, auth }) {
          return mainThread.rejected({ url, auth });
        },
      });
    },
    pull: async => {
      return;
    },
    clone: async args => {
      return git.clone({
        ...args,
        fs,
        http: GitHttp,
        dir,
        onAuth(url) {
          return mainThread.fill(url);
        },
        onAuthFailure({ url, auth }) {
          return mainThread.rejected({ url, auth });
        },
      });
    },
  });
})();
