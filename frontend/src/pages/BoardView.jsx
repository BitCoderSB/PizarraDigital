// src/views/BoardView.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { socket } from '../services/socket'
import Toolbar from '../components/Toolbar'
import Canvas from '../components/Canvas'
import TextBox from '../components/TextBox'
import ChatSidebar from '../components/ChatSidebar'
import { useBoard } from '../hooks/useBoard' 
import { useChat } from '../hooks/useChat'
import { useHandPointer } from '../hooks/useHandPointer'
import { useVoiceCommands } from '../hooks/useVoiceCommands'
import { v4 as uuidv4 } from 'uuid'

export default function BoardView() {
  const { boardId } = useParams()
  const {
    elements, textBoxes,
    addElement, updateElement, removeElement,
    addTextBox, updateTextBox
  } = useBoard(boardId)

  const [userName, setUserName] = useState('')
  useEffect(() => {
    if (socket.connected) setUserName(socket.id)
    else socket.on('connect', () => setUserName(socket.id))
  }, [])

  const { messages, sendMessage } = useChat(boardId, userName)

  const [tool, setTool]         = useState('select')
  const [color, setColor]       = useState('#3b82f6')
  const [chatOpen, setChatOpen] = useState(false)

  // Tamaño por defecto para textos nuevos
  const [defaultFontSize, setDefaultFontSize] = useState(14)

  const [gesturesEnabled, setGesturesEnabled] = useState(false)
  const videoRef = useRef(null)
  const svgRef   = useRef(null)

  // Selección
  const [selectedElementId, setSelectedElementId] = useState(null)
  const selectedElement = elements.find(e => e.id === selectedElementId) || null
  const isTextSelected  = !!selectedElement && selectedElement.type === 'text'

  // ---- REFS para que el callback de voz sea estable y lea estado fresco ----
  const selectedElementRef = useRef(selectedElement)
  const isTextSelectedRef  = useRef(isTextSelected)
  useEffect(() => {
    selectedElementRef.current = selectedElement
    isTextSelectedRef.current  = isTextSelected
  }, [selectedElement, isTextSelected])

  // También guardamos acciones usadas por voz en refs (evita meterlas en deps)
  const updateElementRef = useRef(updateElement)
  const updateTextBoxRef = useRef(updateTextBox)
  const setToolRef       = useRef(setTool)
  const setColorRef      = useRef(setColor)
  const setDefaultFontSizeRef = useRef(setDefaultFontSize)
  useEffect(() => {
    updateElementRef.current = updateElement
    updateTextBoxRef.current = updateTextBox
    setToolRef.current       = setTool
    setColorRef.current      = setColor
    setDefaultFontSizeRef.current = setDefaultFontSize
  }, [updateElement, updateTextBox, setTool, setColor, setDefaultFontSize])

  // Valor mostrado en Toolbar
  const shownFontSize = isTextSelected
    ? (selectedElement.fontSize ?? defaultFontSize)
    : defaultFontSize

  const handleHandPointerReady = useCallback(ctrl => {
    if (ctrl && typeof ctrl.hidePreview === 'function') {
      ctrl.hidePreview()
    } else {
      if (videoRef.current) {
        videoRef.current.style.display = 'none'
      }
    }
  }, [])

  useHandPointer({
    videoRef,
    svgRef,
    enabled: gesturesEnabled,
    onReady: handleHandPointerReady
  })

  // ---- CALLBACK DE VOZ ESTABLE (sin dependencias) ----
  const handleVoiceCommand = useCallback((command) => {
    // Herramientas / color siempre disponibles
    if (command.type === 'tool') {
      setToolRef.current(command.value)
      return
    }
    if (command.type === 'color') {
      setColorRef.current(command.value)
      return
    }
    if (command.type === 'fontSize') {
      // Si hay texto seleccionado, cambia ese; si no, cambia el default
      if (isTextSelectedRef.current && selectedElementRef.current) {
        const id = selectedElementRef.current.id
        updateElementRef.current({ id, fontSize: command.value, updatedAt: Date.now() })
        updateTextBoxRef.current(id, { fontSize: command.value })
      } else {
        setDefaultFontSizeRef.current(command.value)
      }
    }
  }, [])

  const { isListening, startListening, stopListening } = useVoiceCommands(handleVoiceCommand)

  // Toggle video con tecla 'v'
  useEffect(() => {
    const onKey = e => {
      if (e.key.toLowerCase() === 'v' && gesturesEnabled) {
        if (videoRef.current) {
          videoRef.current.style.display =
            videoRef.current.style.display === 'none' ? 'block' : 'none'
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gesturesEnabled])

  // Borrar con Delete/Backspace
  useEffect(() => {
    const handleDeleteKey = e => {
      const isInputFocused =
        document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.contentEditable === 'true'

      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedElementId &&
        (!isInputFocused || (document.activeElement.id !== selectedElementId && isInputFocused))
      ) {
        e.preventDefault()
        removeElement(selectedElementId)
        setSelectedElementId(null)
      }
    }

    window.addEventListener('keydown', handleDeleteKey)
    return () => window.removeEventListener('keydown', handleDeleteKey)
  }, [selectedElementId, removeElement])

  // Cambiar SOLO el tamaño del texto seleccionado (desde Toolbar cuando hay selección)
  const setSelectedFontSizeFromToolbar = useCallback((newSize) => {
    if (!isTextSelected || !selectedElement) return
    const id = selectedElement.id
    updateElement({ id, fontSize: newSize, updatedAt: Date.now() })
    updateTextBox(id, { fontSize: newSize })
  }, [isTextSelected, selectedElement, updateElement, updateTextBox])

  // Cambiar DEFAULT para textos nuevos (desde Toolbar cuando NO hay selección)
  const setDefaultFontSizeFromToolbar = useCallback((newSize) => {
    setDefaultFontSize(newSize)
  }, [])

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100">
      <Toolbar
        tool={tool}
        onToolSelect={setTool}
        currentColor={color}
        onColorChange={setColor}
        onToggleChat={() => setChatOpen(o => !o)}
        gesturesEnabled={gesturesEnabled}
        onToggleGestures={setGesturesEnabled}

        isTextSelected={isTextSelected}
        selectedFontSize={isTextSelected ? (selectedElement.fontSize ?? defaultFontSize) : undefined}
        onSelectedFontSizeChange={setSelectedFontSizeFromToolbar}
        currentFontSize={shownFontSize}
        onFontSizeChange={setDefaultFontSizeFromToolbar}

        isVoiceListening={isListening}
        onToggleVoice={isListening ? stopListening : startListening}
      />

      <div className="relative flex-1">
        {gesturesEnabled && (
          <video
            ref={videoRef}
            muted
            playsInline
            className="fixed bottom-4 right-4 w-40 h-28 border-2 border-blue-600 rounded z-50"
          />
        )}

        <Canvas
          ref={svgRef}
          className="absolute inset-0 w-full h-full"
          elements={elements}
          onAdd={el => addElement({ ...el, color })}
          onMove={updatedProps => {
            updateElement(updatedProps)
            const movedTextBox = textBoxes.find(tb => tb.id === updatedProps.id)
            if (movedTextBox) {
              updateTextBox(movedTextBox.id, { 
                x: updatedProps.x ?? movedTextBox.x,
                y: updatedProps.y ?? movedTextBox.y,
                width: updatedProps.width ?? movedTextBox.width,
                height: updatedProps.height ?? movedTextBox.height,
                fontSize: updatedProps.fontSize ?? movedTextBox.fontSize
              })
            }
          }}
          onRemove={removeElement}
          onSelectText={pos => {
            const tempTextId = uuidv4()
            addTextBox({
              id: tempTextId,
              type: 'text',
              x: pos.x,
              y: pos.y,
              width: 150,
              height: 40,
              text: '',
              placeholder: 'Escribe algo…',
              color,
              fontSize: defaultFontSize,
              focus: true
            })
            setTool('select')
          }}
          tool={tool}
          drawColor={color}
          selectedElementId={selectedElementId}
          onSelectElement={setSelectedElementId}
        />

        {textBoxes.map(box => (
          <TextBox
            key={box.id}
            data={box}
            onChange={props => {
              const effectiveFontSize = props.fontSize ?? box.fontSize ?? defaultFontSize
              updateTextBox(box.id, { ...props, fontSize: effectiveFontSize })

              if ((props.text ?? '').trim() === '') {
                removeElement(box.id)
                updateTextBox(box.id, { deleted: true })
              } else {
                const existingEl = elements.find(el => el.id === box.id)
                const payload = {
                  id: box.id,
                  type: 'text',
                  x: props.x ?? box.x,
                  y: props.y ?? box.y,
                  width: props.width ?? box.width,
                  height: props.height ?? box.height,
                  text: props.text ?? box.text,
                  color: props.color ?? box.color,
                  fontSize: effectiveFontSize
                }
                if (!existingEl) {
                  addElement(payload)
                } else {
                  updateElement(payload)
                }
              }
            }}
            tool={tool}
            onSelect={() => setSelectedElementId(box.id)}
          />
        ))}
      </div>

      {chatOpen && (
        <ChatSidebar
          messages={messages}
          onSend={sendMessage}
          onClose={() => setChatOpen(false)}
          currentUser={userName}
        />
      )}
    </div>
  )
}
