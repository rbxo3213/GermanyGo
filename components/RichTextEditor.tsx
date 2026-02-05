import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import {
    Bold, Italic, Underline as UnderlineIcon,
    List, ListOrdered, CheckSquare,
    Heading1, Heading2, Quote
} from 'lucide-react'

interface Props {
    content: string;
    onChange: (html: string) => void;
    editable?: boolean;
    placeholder?: string;
}

export default function RichTextEditor({ content, onChange, editable = true, placeholder = "내용을 입력하세요..." }: Props) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: content,
        editable: editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base focus:outline-none max-w-none min-h-[150px]',
            },
        },
    });

    if (!editor) {
        return null;
    }

    return (
        <div className={`rich-editor ${editable ? "border border-gray-200 rounded-xl bg-white" : ""}`}>
            {editable && (
                <div className="flex flex-wrap gap-1 p-2 border-b border-gray-100 bg-gray-50/50 rounded-t-xl overflow-x-auto">
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        isActive={editor.isActive('bold')}
                        icon={<Bold size={16} />}
                    />
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        isActive={editor.isActive('italic')}
                        icon={<Italic size={16} />}
                    />
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        isActive={editor.isActive('underline')}
                        icon={<UnderlineIcon size={16} />}
                    />
                    <div className="w-px h-6 bg-gray-200 mx-1 mobile-hide" />
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        isActive={editor.isActive('heading', { level: 2 })}
                        icon={<Heading1 size={16} />}
                    />
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        isActive={editor.isActive('heading', { level: 3 })}
                        icon={<Heading2 size={16} />}
                    />
                    <div className="w-px h-6 bg-gray-200 mx-1" />
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        isActive={editor.isActive('bulletList')}
                        icon={<List size={16} />}
                    />
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        isActive={editor.isActive('orderedList')}
                        icon={<ListOrdered size={16} />}
                    />
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleTaskList().run()}
                        isActive={editor.isActive('taskList')}
                        icon={<CheckSquare size={16} />}
                    />
                    <ToolbarBtn
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        isActive={editor.isActive('blockquote')}
                        icon={<Quote size={16} />}
                    />
                </div>
            )}
            <div className={`${editable ? "p-4" : ""}`}>
                <EditorContent editor={editor} />
            </div>

            <style jsx global>{`
                .ProseMirror p.is-editor-empty:first-child::before {
                    color: #adb5bd;
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
                .ProseMirror ul[data-type="taskList"] {
                    list-style: none;
                    padding: 0;
                }
                .ProseMirror ul[data-type="taskList"] li {
                    display: flex;
                    align-items: flex-start; 
                    margin-bottom: 0.5rem;
                }
                .ProseMirror ul[data-type="taskList"] li > label {
                    flex: 0 0 auto;
                    margin-right: 0.5rem;
                    user-select: none;
                    margin-top: 0.15rem;
                }
                .ProseMirror ul[data-type="taskList"] li > div {
                    flex: 1 1 auto;
                }
                /* Typography Overrides for Tailwind Prose (optional if using @tailwindcss/typography) */
                .prose ul {
                     list-style-type: disc;
                     padding-left: 1.5em;
                }
                .prose ol {
                     list-style-type: decimal;
                     padding-left: 1.5em;
                }
            `}</style>
        </div>
    )
}

function ToolbarBtn({ onClick, isActive, icon }: { onClick: () => void, isActive: boolean, icon: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-slate-900 text-white' : 'text-gray-500 hover:bg-gray-200'
                }`}
        >
            {icon}
        </button>
    )
}
