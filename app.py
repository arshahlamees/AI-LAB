import os
from flask import Flask, request, render_template, jsonify
from werkzeug.utils import secure_filename
from inference import AlexNet150
import torch
from torchvision import transforms
from PIL import Image

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Create uploads folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            class_names = ['buildings', 'forest', 'glacier', 'mountain', 'sea', 'street']
            model_path = 'best_model_AlexNet150.pt'
            
            # Get prediction
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            model = AlexNet150(num_classes=len(class_names))
            model.load_state_dict(torch.load(model_path, map_location=device))
            model.to(device)
            model.eval()
            
            # Preprocessing - using transforms from torchvision
            transform = transforms.Compose([
                transforms.Resize((150, 150)),
                transforms.ToTensor(),
                transforms.Normalize([0.5]*3, [0.5]*3)
            ])
            
            # Load and preprocess image
            img = Image.open(filepath).convert('RGB')
            input_tensor = transform(img).unsqueeze(0).to(device)
            
            # Predict
            with torch.no_grad():
                output = model(input_tensor)
                _, pred = torch.max(output, 1)
            
            predicted_class = class_names[pred.item()]
            
            # Clean up
            os.remove(filepath)
            
            return jsonify({
                'prediction': predicted_class,
                'image_url': f'/uploads/{filename}'
            })
            
        except Exception as e:
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({'error': str(e)}), 500
    
    return jsonify({'error': 'Invalid file type'}), 400

if __name__ == '__main__':
    app.run(debug=True) 