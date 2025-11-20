// client/src/components/FileExplorer.jsx

import React from 'react';

const FileExplorer = ({ files, currentFile, onSwitchFile }) => {
    return (
        <div style={{ padding: '10px 0', borderRight: '1px solid #333', minWidth: '200px', backgroundColor: '#222', color: '#fff', height: '100%' }}>
            <h3 style={{ margin: '0 10px 10px', fontSize: '1.1em', color: '#888' }}>
                Project Files ({files.length})
            </h3>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {files.map((file) => (
                    <li
                        key={file.name}
                        onClick={() => onSwitchFile(file.name)}
                        style={{
                            padding: '8px 10px',
                            cursor: 'pointer',
                            backgroundColor: file.name === currentFile ? '#007bff' : 'transparent',
                            color: file.name === currentFile ? 'white' : '#ccc',
                            borderLeft: file.name === currentFile ? '4px solid #fff' : '4px solid transparent',
                        }}
                    >
                        {file.name}
                    </li>
                ))}
            </ul>
            {/* ⭐️ NEW: File Operations UI */}
            <div style={{ padding: '10px', borderTop: '1px solid #444' }}>
                <button onClick={onCreateFile} style={{ padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}>
                    + New File
                </button>
                {currentFile !== 'index.js' && files.length > 1 && ( // Safety check: can't delete main file or last file
                    <button onClick={() => onDeleteFile(currentFile)} style={{ padding: '5px 10px', backgroundColor: '#ff5c5c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Delete Current
                    </button>
                )}
            </div>
        </div>
    );
};

export default FileExplorer;