import React, { useState, useCallback, useRef, useEffect } from 'react'

interface Node {
  id: string
  content: string
  children: Node[]
  collapsed?: boolean
}

const MindMapNode: React.FC<{
  node: Node
  onAddChild: (parentId: string) => void
  onDeleteNode: (id: string) => void
  onUpdateContent: (id: string, content: string) => void
  onToggleCollapse: (id: string) => void
  depth?: number
}> = ({ node, onAddChild, onDeleteNode, onUpdateContent, onToggleCollapse, depth = 0 }) => {
  return (
    <div className="flex items-center">
      <div className="relative">
        <div
          className="border rounded p-2 mb-2 cursor-pointer bg-white min-w-[100px] max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap"
          onClick={() => onDeleteNode(node.id)}
          onContextMenu={(e) => {
            e.preventDefault()
            onAddChild(node.id)
          }}
        >
          {node.content}
        </div>
        {node.children.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleCollapse(node.id)
            }}
            className="absolute -right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white border rounded-full flex items-center justify-center"
          >
            {node.collapsed ? '+' : '-'}
          </button>
        )}
      </div>
      {!node.collapsed && node.children.length > 0 && (
        <div className={`flex flex-col ${depth % 2 === 0 ? 'items-start' : 'items-end'}`}>
          <div className="w-8 border-t border-gray-300"></div>
          <div className="flex">
            <div className="w-8 border-r border-gray-300"></div>
            <div className="flex flex-col justify-center space-y-4">
              {node.children.map((child) => (
                <MindMapNode
                  key={child.id}
                  node={child}
                  onAddChild={onAddChild}
                  onDeleteNode={onDeleteNode}
                  onUpdateContent={onUpdateContent}
                  onToggleCollapse={onToggleCollapse}
                  depth={depth + 1}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const TextualMindMap: React.FC<{
  nodes: Node[]
  onUpdateContent: (id: string, content: string) => void
  onAddSibling: (path: number[]) => void
  onIndent: (path: number[]) => void
  onOutdent: (path: number[]) => void
  onToggleCollapse: (id: string) => void
  path?: number[]
  focusNodeId?: string
}> = ({
  nodes,
  onUpdateContent,
  onAddSibling,
  onIndent,
  onOutdent,
  onToggleCollapse,
  path = [],
  focusNodeId,
}) => {
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({})
  const [isComposing, setIsComposing] = useState<{ [key: string]: boolean }>({})
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)

  useEffect(() => {
    if (focusNodeId && textareaRefs.current[focusNodeId]) {
      textareaRefs.current[focusNodeId]?.focus()
    }
  }, [focusNodeId])

  const handleContentChange =
    (id: string) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onUpdateContent(id, e.target.value)
    }

  const handleCompositionStart = (id: string) => () => {
    setIsComposing((prev) => ({ ...prev, [id]: true }))
  }

  const handleCompositionEnd = (id: string) => () => {
    setIsComposing((prev) => ({ ...prev, [id]: false }))
  }

  const handleKeyDown =
    (id: string, currentPath: number[]) => (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !isComposing[id] && !e.shiftKey) {
        e.preventDefault()
        onAddSibling(currentPath)
      } else if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault()
        onIndent(currentPath)
      } else if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault()
        onOutdent(currentPath)
      }
    }

  return (
    <ul className="list-none pl-4">
      {nodes.map((node, index) => {
        const currentPath = [...path, index]

        return (
          <li
            key={node.id}
            onMouseEnter={() => setHoveredNodeId(node.id)}
            onMouseLeave={() => setHoveredNodeId((prev) => (prev === node.id ? null : prev))}
          >
            <div className="flex items-start">
              <div
                className="mr-1 mt-1 cursor-pointer w-4 h-4 flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation()
                  if (node.children.length > 0) {
                    onToggleCollapse(node.id)
                  }
                }}
              >
                {node.children.length > 0 ? (
                  hoveredNodeId === node.id ? (
                    node.collapsed ? (
                      <span>▶</span>
                    ) : (
                      <span>▼</span>
                    )
                  ) : (
                    <span>•</span>
                  )
                ) : (
                  <span>•</span>
                )}
              </div>
              <div className="flex-1">
                <textarea
                  value={node.content}
                  onChange={handleContentChange(node.id)}
                  ref={(el) => (textareaRefs.current[node.id] = el)}
                  onCompositionStart={handleCompositionStart(node.id)}
                  onCompositionEnd={handleCompositionEnd(node.id)}
                  onKeyDown={handleKeyDown(node.id, currentPath)}
                  className="border-b border-gray-300 focus:outline-none focus:border-blue-500 w-full resize-none overflow-hidden"
                  rows={1}
                />
                {!node.collapsed && node.children.length > 0 && (
                  <TextualMindMap
                    nodes={node.children}
                    onUpdateContent={onUpdateContent}
                    onAddSibling={onAddSibling}
                    onIndent={onIndent}
                    onOutdent={onOutdent}
                    onToggleCollapse={onToggleCollapse}
                    path={currentPath}
                    focusNodeId={focusNodeId}
                  />
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default function MindMap() {
  const [root, setRoot] = useState<Node>({
    id: '0',
    content: 'Root',
    children: [],
    collapsed: false,
  })
  const [focusNodeId, setFocusNodeId] = useState<string | undefined>(undefined)

  const handleAddChild = useCallback(
    (parentId: string) => {
      const newNode: Node = {
        id: Math.random().toString(36).substr(2, 9),
        content: 'New Node',
        children: [],
      }

      const addChildToNode = (node: Node): Node => {
        if (node.id === parentId) {
          return { ...node, children: [...node.children, newNode] }
        }
        return {
          ...node,
          children: node.children.map(addChildToNode),
        }
      }

      setRoot(addChildToNode(root))
    },
    [root]
  )

  const handleDeleteNode = useCallback(
    (id: string) => {
      const deleteNodeFromTree = (node: Node): Node | null => {
        if (node.id === id) {
          return null
        }
        return {
          ...node,
          children: node.children
            .map(deleteNodeFromTree)
            .filter((child): child is Node => child !== null),
        }
      }

      const newRoot = deleteNodeFromTree(root)
      if (newRoot) {
        setRoot(newRoot)
      }
    },
    [root]
  )

  const handleUpdateContent = useCallback(
    (id: string, content: string) => {
      const updateNodeContent = (node: Node): Node => {
        if (node.id === id) {
          return { ...node, content }
        }
        return {
          ...node,
          children: node.children.map(updateNodeContent),
        }
      }

      setRoot(updateNodeContent(root))
    },
    [root]
  )

  const updateNodeAtPath = (
    node: Node,
    path: number[],
    updater: (node: Node, index: number, path: number[]) => Node | null
  ): Node | null => {
    if (path.length === 0) {
      return updater(node, 0, path)
    }

    const [index, ...rest] = path
    if (index < 0 || index >= node.children.length) {
      return node
    }

    const updatedChild = updateNodeAtPath(node.children[index], rest, updater)
    if (updatedChild === null) {
      // Remove the child
      const newChildren = node.children.filter((_, i) => i !== index)
      return { ...node, children: newChildren }
    } else {
      return {
        ...node,
        children: node.children.map((child, i) =>
          i === index ? updatedChild : child
        ),
      }
    }
  }

  const handleAddSibling = useCallback(
    (path: number[]) => {
      const newNode: Node = {
        id: Math.random().toString(36).substr(2, 9),
        content: '',
        children: [],
      }

      const parentPath = path.slice(0, -1)
      const index = path[path.length - 1]

      setRoot((prevRoot) => {
        const newRoot = updateNodeAtPath(prevRoot, parentPath, (node) => {
          const newChildren = [
            ...node.children.slice(0, index + 1),
            newNode,
            ...node.children.slice(index + 1),
          ]
          return { ...node, children: newChildren }
        })
        return newRoot || prevRoot
      })

      // Set focus to the new node
      setFocusNodeId(newNode.id)
    },
    [setRoot, setFocusNodeId]
  )

  const handleIndent = useCallback(
    (path: number[]) => {
      if (path.length === 0) {
        // Can't indent root node
        return
      }

      const parentPath = path.slice(0, -1)
      const index = path[path.length - 1]

      if (index === 0) {
        // No previous sibling to indent into
        return
      }

      setRoot((prevRoot) => {
        const newRoot = updateNodeAtPath(prevRoot, parentPath, (node) => {
          const targetNode = node.children[index]
          const previousSibling = node.children[index - 1]

          // Remove targetNode from current children
          const newChildren = node.children.filter((_, i) => i !== index)

          // Add targetNode as child of previous sibling
          const newPreviousSibling = {
            ...previousSibling,
            children: [...previousSibling.children, targetNode],
          }

          // Replace previous sibling and update children
          newChildren[index - 1] = newPreviousSibling

          return { ...node, children: newChildren }
        })
        return newRoot || prevRoot
      })
    },
    [setRoot]
  )

  const handleOutdent = useCallback(
    (path: number[]) => {
      if (path.length < 2) {
        // Can't outdent root node
        return
      }

      const parentPath = path.slice(0, -1)
      const grandparentPath = path.slice(0, -2)
      const index = path[path.length - 1]
      const parentIndex = path[path.length - 2]

      setRoot((prevRoot) => {
        const newRoot = updateNodeAtPath(prevRoot, grandparentPath, (node) => {
          const parentNode = node.children[parentIndex]
          const targetNode = parentNode.children[index]
          const followingSiblings = parentNode.children.slice(index + 1)

          // Remove targetNode and following siblings from parent's children
          const newParentChildren = parentNode.children.slice(0, index)

          const newParentNode = {
            ...parentNode,
            children: newParentChildren,
          }

          // Set targetNode's children to include following siblings
          const newTargetNode = {
            ...targetNode,
            children: [...targetNode.children, ...followingSiblings],
          }

          // Insert newTargetNode into grandparent's children after parentNode
          const newChildren = node.children.flatMap((child, i) => {
            if (i === parentIndex) {
              return [newParentNode, newTargetNode]
            }
            return [child]
          })

          return { ...node, children: newChildren }
        })
        return newRoot || prevRoot
      })
    },
    [setRoot]
  )

  const handleToggleCollapse = useCallback(
    (id: string) => {
      const toggleCollapse = (node: Node): Node => {
        if (node.id === id) {
          return { ...node, collapsed: !node.collapsed }
        }
        return { ...node, children: node.children.map(toggleCollapse) }
      }
      setRoot(toggleCollapse(root))
    },
    [root]
  )

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">思维导图</h1>
      <div className="flex">
        <div className="w-2/3 pr-4 overflow-auto">
          <h2 className="text-xl font-semibold mb-2">图形视图</h2>
          <div className="border p-4 rounded-lg bg-gray-50">
            <MindMapNode
              node={root}
              onAddChild={handleAddChild}
              onDeleteNode={handleDeleteNode}
              onUpdateContent={handleUpdateContent}
              onToggleCollapse={handleToggleCollapse}
            />
          </div>
        </div>
        <div className="w-1/3 pl-4 border-l">
          <h2 className="text-xl font-semibold mb-2">文本视图（可编辑）</h2>
          <TextualMindMap
            nodes={root.children}
            onUpdateContent={handleUpdateContent}
            onAddSibling={handleAddSibling}
            onIndent={handleIndent}
            onOutdent={handleOutdent}
            onToggleCollapse={handleToggleCollapse}
            focusNodeId={focusNodeId}
          />
        </div>
      </div>
    </div>
  )
}