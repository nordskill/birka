import BibeEditor from '../../components/bibe-editor';
import FileCRUD from '../../components/file-crud';
import TagsCRUD from "../../components/tags-crud";

export default async function () {

   const updateURL = document.querySelector('.post_editor').dataset.updateUrl;

   new FileCRUD('.option-1');
   new TagsCRUD('.tags_crud');

   new BibeEditor({
      container: '.post_editor',
      update_url: updateURL,
      token: document.querySelector('meta[name="csrf"]').content
   });

}