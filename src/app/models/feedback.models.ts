
import { Project } from './project.model';
import { User   } from './user.model';


export interface DeveloperFeedback {
  id:             number;
  project:        Project;
  developer:      User;
  qualiteCode:    number;   
  respectDelais:  number;   
  travailEquipe:  number;   
  autonomie:      number;   
  score10:        number;   
  commentaire?:   string | null;
  createdAt:      string;   
  updatedAt?:     string | null;
}


export interface FeedbackForm {
  qualiteCode:    number;
  respectDelais:  number;
  travailEquipe:  number;
  autonomie:      number;
  commentaire?:   string;
}
