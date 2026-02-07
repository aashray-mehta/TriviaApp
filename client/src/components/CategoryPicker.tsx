import {
  Paper,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import QuizIcon from '@mui/icons-material/Quiz';

interface Props {
  categories: string[];
  onSelect: (category: string) => void;
}

export default function CategoryPicker({ categories, onSelect }: Props) {
  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Choose a Category
      </Typography>
      <List>
        {categories.map((cat) => (
          <ListItemButton key={cat} onClick={() => onSelect(cat)}>
            <ListItemIcon>
              <QuizIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary={cat} />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
}
