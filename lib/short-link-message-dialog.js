'use babel';

import * as React from 'react';
import { CompositeDisposable } from 'event-kit';

export default class ShortLinkMessageDialog extends React.Component {

  componentWillMount () {
    // Events subscribed to in Inkdrop's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this dialog
    this.subscriptions.add(inkdrop.commands.add(document.body, {
      'short-link:toggle': () => this.toggle()
    }));
    global.inkdrop.onEditorLoad((editor) => {
      // Hide links on the first note that is show at startup.
      this.toggle();
      editor.cm.on("cursorActivity", (cm, changes) => {
        // Automatically hide links when loading a new note or editing a note.
        this.toggle();
      })
    });
  }

  componentWillUnmount () {
    this.subscriptions.dispose();
  }

  render() {
    const { MessageDialog } = inkdrop.components.classes;
    return (
      <MessageDialog ref='dialog' title='ShortLink'>
        ShortLink was toggled!
      </MessageDialog>
    );
  }

  toggle() {
    const cm = inkdrop.getActiveEditor().cm;
    // used to match the url in the [example](here://something)
    const urlRe = /\]\(([\w:\-/?#\d\s.="']+)\)/gmi;
    // used to match URLs inside <>, e.g. [example](<http://si.te#(data)>)
    const angleUrlRe = /\]\(<([^>]*)>\)/gm;

    const cursor = cm.getCursor();
    const editing = !(cursor.line === 0 && cursor.ch === 0);

    cm.doc
      .getValue() // get whole page content
      .split('\n') // make it an array
      .forEach((line, lineNum) => {
        // Don't hide links that we are currently editing.
        if (editing && cursor.line === lineNum) return;

        let match;
        for (const re of [urlRe, angleUrlRe]) {

          while ((match = re.exec(line))) {
            // Replacement element for the URL.
            const el = document.createElement('a');
            el.href = match[1];  // Open the URL in the browser on click.
            el.title = match[1]; // Show the original URL on hover.
            el.innerText = '(' + inkdrop.config.get('short-link.linkEmoji') + ')';

            cm.markText({
              line : lineNum,
              ch: match.index + 1 // from
            }, {
              line: lineNum,
              ch: re.lastIndex, // to
            }, {
              atomic: 1,
              replacedWith: el,
              clearOnEnter: true,
              handleMouseEvents: true,
            });
          }
        }
      }
    );
  }
}
