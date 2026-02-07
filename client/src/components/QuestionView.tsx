import {
  Paper,
  Typography,
  List,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import type { QuestionPayload } from '../types';

interface Props {
  question: QuestionPayload;
  onAnswer: (chosenIndex: number) => void;
  loading: boolean;
}

export default function QuestionView({ question, onAnswer, loading }: Props) {
  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Question
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        {question.text}
      </Typography>
      <List>
        {question.options.map((opt, idx) => (
          <ListItemButton
            key={idx}
            onClick={() => onAnswer(idx)}
            disabled={loading}
            sx={{
              mb: 1,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <ListItemText
              primary={`${String.fromCharCode(65 + idx)}. ${opt}`}
            />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
}
