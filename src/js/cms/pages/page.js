import BibeEditor from '../../components/bibe-editor';
import TagsCRUD from "../../components/tags-crud";

export default async function () {

   new TagsCRUD('.tags_crud');

   if (!document.querySelector('.post_editor')) return;
   const editor = new BibeEditor('.post_editor');

}