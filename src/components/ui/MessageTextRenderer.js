import React from 'react';
import { processMessageText } from '../../utils/emojiParser';
import { cn } from '../../lib/utils';

/**
 * Enhanced message text renderer with emoji support
 * Handles WhatsApp-style emoji parsing, sizing, and formatting
 */
const MessageTextRenderer = ({ 
  text, 
  isFromCustomer = false, 
  className = '',
  enableFormatting = true 
}) => {
  if (!text || typeof text !== 'string') return null;

  // Process the message for emojis and formatting
  const { 
    text: processedText, 
    hasEmojis, 
    isEmojiOnly, 
    emojiCount, 
    classes: emojiClasses 
  } = processMessageText(text);

  // Format text with proper line breaks and styling
  const formatText = (text) => {
    return text.split('\n').map((line, lineIndex) => {
      if (!line.trim()) {
        return <br key={lineIndex} />;
      }

      // Handle bold text (WhatsApp uses *bold*)
      let formattedLine = line;
      if (enableFormatting) {
        // Bold text: *text* or **text**
        formattedLine = formattedLine.replace(
          /\*\*([^*]+)\*\*|\*([^*]+)\*/g, 
          '<strong>$1$2</strong>'
        );
        
        // Italic text: _text_
        formattedLine = formattedLine.replace(
          /_([^_]+)_/g, 
          '<em>$1</em>'
        );
        
        // Strikethrough text: ~text~
        formattedLine = formattedLine.replace(
          /~([^~]+)~/g, 
          '<del>$1</del>'
        );
        
        // Monospace text: ```text```
        formattedLine = formattedLine.replace(
          /```([^`]+)```/g, 
          '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">$1</code>'
        );
      }
      
      // Handle bullet points
      if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
        const bulletText = line.replace(/^[•\-*]\s*/, '');
        const processedBullet = processMessageText(bulletText);
        
        return (
          <div key={lineIndex} className="flex items-start ml-2 mb-1">
            <span className={cn(
              "mr-2 mt-1 select-none",
              isFromCustomer 
                ? "text-slate-600 dark:text-slate-400" 
                : "text-slate-300 dark:text-slate-600"
            )}>
              •
            </span>
            <span 
              className={cn(
                "flex-1",
                processedBullet.classes
              )}
              dangerouslySetInnerHTML={{ __html: bulletText }}
            />
          </div>
        );
      }
      
      // Handle numbered lists
      const numberedMatch = line.match(/^(\d+)\.\s*(.+)$/);
      if (numberedMatch) {
        const [, number, content] = numberedMatch;
        const processedContent = processMessageText(content);
        
        return (
          <div key={lineIndex} className="flex items-start ml-2 mb-1">
            <span className={cn(
              "mr-2 mt-1 select-none font-medium",
              isFromCustomer 
                ? "text-slate-600 dark:text-slate-400" 
                : "text-slate-300 dark:text-slate-600"
            )}>
              {number}.
            </span>
            <span 
              className={cn(
                "flex-1",
                processedContent.classes
              )}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        );
      }
      
      // Regular line with emoji processing
      const lineProcessed = processMessageText(line);
      return (
        <div 
          key={lineIndex} 
          className={cn(
            lineIndex > 0 ? 'mt-1' : '',
            lineProcessed.classes
          )}
          dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      );
    });
  };

  // Base text styling
  const baseTextClasses = cn(
    "whitespace-pre-wrap leading-relaxed",
    // Emoji-specific sizing
    isEmojiOnly ? cn(
      "text-center py-1",
      emojiClasses
    ) : "text-sm",
    // Color classes
    isFromCustomer 
      ? "text-slate-900 dark:text-slate-100" 
      : "text-white dark:text-slate-900",
    className
  );

  // Special handling for emoji-only messages
  if (isEmojiOnly) {
    return (
      <div className={cn(
        baseTextClasses,
        "flex items-center justify-center gap-1",
        // Add some breathing room for large emojis
        emojiCount === 1 ? "py-2" : "py-1"
      )}>
        <span className="emoji-text select-all">
          {processedText}
        </span>
      </div>
    );
  }

  // Regular text with possible emojis
  return (
    <div className={baseTextClasses}>
      <div className="select-all">
        {formatText(processedText)}
      </div>
    </div>
  );
};

export default MessageTextRenderer;