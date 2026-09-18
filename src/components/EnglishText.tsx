import { StyleProp, Text, TextStyle } from 'react-native';
import { useWordLookup } from '../store/WordLookupContext';

const WORD_PATTERN = /([A-Za-z]+(?:['’-][A-Za-z]+)*)/;

// 単語を含む1文を切り出す（辞書の文脈用。スラッシュリーディングの " / " は除去）
function sentenceOf(text: string, word: string): string {
  const plain = text.replace(/ \/ /g, ' ');
  const sentences = plain.split(/(?<=[.!?])\s+/);
  const hit = sentences.find((s) => new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(s));
  return hit ?? plain.slice(0, 300);
}

// 英文を単語ごとに長押し可能にして、長押しした単語の意味を表示する
export function EnglishText({ text, style }: { text: string; style?: StyleProp<TextStyle> }) {
  const { lookup } = useWordLookup();
  const parts = text.split(WORD_PATTERN);
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <Text key={i} onLongPress={() => lookup(part, sentenceOf(text, part))}>
            {part}
          </Text>
        ) : (
          part
        )
      )}
    </Text>
  );
}
