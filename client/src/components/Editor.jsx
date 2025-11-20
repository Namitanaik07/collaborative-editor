// client/src/components/Editor.jsx (Final Code for Cursor Emitter)

import React, { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import throttle from "lodash/throttle";
//No need for a global monaco import here.. as it's passed via onMount

// Default options for a clean editor experience
const editorOptions = {
    minimap: { enabled: false },
    scrollbar: { vertical: 'hidden' },
    fontSize: 16
};

// We define the throttled function *outside* the component to prevent constant recreation
// It handles emitting the cursor position at a limited rate.
const THROTTLE_TIME = 100;
const throttledEmitCursor = throttle((editor, socket, roomId, username) => {
    if (socket && editor) {
        const position = editor.getPosition();
        if (position) {
            // console.log("[DEBUG A] Emitting Cursor:", position); ----------DEBUG LINE
            socket.emit('cursor-change', {
                roomId,
                username,
                position: { lineNumber: position.lineNumber, column: position.column }
            });
        }
    }
}, THROTTLE_TIME);


function CodeEditor({ code, language, onChange, socket, roomId, username, remoteCursors }) {
    const monacoRef = useRef(null);
    const editorRef = useRef(null);
    let disposablesRef = useRef([]); // To hold cleanup references

    const handleEditorChange = (value) => {
        onChange(value);
    };

    // --- DAY 10: Logic to attach listeners once the editor is mounted ---
    function handleEditorDidMount(editor, monaco) {
        editorRef.current = editor;
        monacoRef.current = monaco;

        // Create the handler that calls the throttled function
        const handleCursorChange = () => {
            throttledEmitCursor(editor, socket, roomId, username);
        };
        
        // Attach listeners and store them for cleanup
        disposablesRef.current.push(editor.onDidChangeCursorPosition(handleCursorChange));
        disposablesRef.current.push(editor.onDidChangeCursorSelection(handleCursorChange));

        // Important: Clean up the listeners when the component unmounts
        return () => {
            disposablesRef.current.forEach(d => d.dispose());
            disposablesRef.current = [];
        };
    }

    // --- DAY 10: Effect to manage remote cursor decorations (Visuals) ---
    useEffect(() => {
        if (!editorRef.current || !monacoRef.current) return;

        const editor = editorRef.current;
        const monacoInstance = monacoRef.current;
        let currentDecorations = [];

        // Style Injection Logic (Same as before) 
        const userColors = {};
        let colorIndex = 0;
        const availableColors = ['#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f']; 

        const injectStyles = () => {
            let styleContent = '';
            for (const user in remoteCursors) {
                if (!userColors[user]) {
                    userColors[user] = availableColors[colorIndex % availableColors.length];
                    colorIndex++;
                }
                const color = userColors[user];
                const safeUser = user.replace(/\s/g, '-');
                styleContent += `
    .remote-cursor-label-${safeUser}:after {
        content: "${user}" !important; /* Force the content to appear */
        background-color: ${color} !important;
        /* Add high specificity selector prefix if necessary, e.g., 
           .monaco-editor .remote-cursor-label-${safeUser}:after */
    }
`;
                styleContent += `.remote-cursor-line-${safeUser} { border-left-color: ${color} !important; background-color: ${color}20; }`;
                styleContent += `.remote-cursor-label-${safeUser}:after { content: "${user}"; background-color: ${color} !important; }`;
            }

            let styleTag = document.getElementById('remote-cursor-styles');
            if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = 'remote-cursor-styles';
                document.head.appendChild(styleTag);
            }
            styleTag.innerHTML = styleContent;
        };

        const getDecorations = () => {
            const newDecorations = [];
            injectStyles();

            for (const user in remoteCursors) {
                const position = remoteCursors[user];
                if (!monacoInstance.Range || !position) continue; // Safety check

                // ... (Color assignment logic) ...
                if (!userColors[user]) {
                    userColors[user] = availableColors[colorIndex % availableColors.length];
                    colorIndex++;
                }
                const color = userColors[user];
                const safeUser = user.replace(/\s/g, '-');
                
               // client/src/components/Editor.jsx (Inside getDecorations)

// 1. The cursor line (highlights the entire line)
newDecorations.push({
    range: new monacoInstance.Range(position.lineNumber, 1, position.lineNumber, 1),
    options: { 
        className: 'remote-cursor-line',
        /* overviewRuler: {
            color: color,
            position: monacoInstance.editor.OverviewRulerLane.Full
        }, */
        inlineClassName: `remote-cursor-line-${safeUser}` // Dynamic clr class
    }
});

               // 2. The cursor head/label (the tiny box with the username)

newDecorations.push({
    range: new monacoInstance.Range(position.lineNumber, position.column, position.lineNumber, position.column + 1),
    options: {
        // ...
        afterContentClassName: `remote-cursor-label-${safeUser}`, 
       
    }
});
            }
            return newDecorations;
        };

        // Apply decorations
        currentDecorations = editor.deltaDecorations(currentDecorations, getDecorations());

        // Cleanup function 
        return () => {
            editor.deltaDecorations(currentDecorations, []);
        };

    }, [remoteCursors]); // Dependency is correct: Rerun when new data arrives

    return (
        <div style={{ height: '100%', border: '1px solid #ddd' }}>
            <Editor
                height="100%"
                language={language}
                theme="vs-dark"
                value={code}
                options={editorOptions}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount} // Attaching the mount handler is critical
            />
        </div>
    );
}

export default CodeEditor;