"""
STEP 3: MODEL TRAINING
======================
This script trains an LSTM neural network to recognize head gestures.

Usage:
    python 3_train_model.py

What it does:
    - Loads preprocessed training data
    - Splits data into training and validation sets
    - Trains an LSTM neural network
    - Evaluates model performance
    - Saves the trained model

Model Architecture:
    - 3 LSTM layers (128 → 64 → 32 units)
    - Batch normalization and dropout for regularization
    - Dense layers for classification
    - Softmax output for 3 classes (YES, NO, NEUTRAL)

Training Features:
    - Early stopping to prevent overfitting
    - Learning rate reduction on plateau
    - Model checkpointing to save best weights
    - Comprehensive evaluation metrics

Output:
    - models/gesture_classifier.h5: Trained model
    - models/best_model.h5: Best model during training
    - models/model_info.json: Training metadata
    - models/training_history.png: Training curves visualization
"""

import numpy as np
import tensorflow as tf
from tensorflow import keras
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
from pathlib import Path
import json
from datetime import datetime
import time

class GestureModelTrainer:
    def __init__(self, data_path="data", model_path="models"):
        self.data_path = Path(data_path)
        self.model_path = Path(model_path)
        self.model_path.mkdir(exist_ok=True)
        
        self.model = None
        self.history = None
        self.label_names = {0: "YES", 1: "NO", 2: "NEUTRAL"}
    
    def load_data(self):
        """Load preprocessed training data"""
        data_file = self.data_path / "training_data.npz"
        
        if not data_file.exists():
            print("❌ ERROR: Training data not found!")
            print(f"   Looking for: {data_file}")
            print("\n   Please run '2_extract_features.py' first")
            return None, None
        
        print("Loading training data...")
        data = np.load(str(data_file), allow_pickle=True)
        
        X = data['X']
        y = data['y']
        
        print(f"✓ Loaded {len(X)} sequences")
        print(f"  Shape: {X.shape}")
        
        # Display label distribution
        unique, counts = np.unique(y, return_counts=True)
        print(f"\n  Label distribution:")
        for label, count in zip(unique, counts):
            label_name = self.label_names[label]
            print(f"    {label_name:8}: {count} samples")
        
        return X, y
    
    def create_model(self, input_shape, num_classes=3):
        """
        Create LSTM model for gesture classification
        
        Architecture:
            Input → LSTM(128) → LSTM(64) → LSTM(32) → Dense(64) → Dense(32) → Output(3)
            
        Args:
            input_shape: (sequence_length, num_features)
            num_classes: Number of output classes (default 3)
            
        Returns:
            Compiled Keras model
        """
        model = keras.Sequential([
            keras.layers.Input(shape=input_shape),
            
            # First LSTM layer - captures long-term patterns
            keras.layers.LSTM(128, return_sequences=True),
            keras.layers.BatchNormalization(),
            keras.layers.Dropout(0.3),
            
            # Second LSTM layer - refines features
            keras.layers.LSTM(64, return_sequences=True),
            keras.layers.BatchNormalization(),
            keras.layers.Dropout(0.3),
            
            # Third LSTM layer - final temporal processing
            keras.layers.LSTM(32),
            keras.layers.BatchNormalization(),
            keras.layers.Dropout(0.3),
            
            # Dense layers for classification
            keras.layers.Dense(64, activation='relu'),
            keras.layers.Dropout(0.2),
            keras.layers.Dense(32, activation='relu'),
            
            # Output layer - 3 classes with softmax
            keras.layers.Dense(num_classes, activation='softmax')
        ], name='GestureRecognitionModel')
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def train(self, X, y, epochs=50, batch_size=32, validation_split=0.2):
        """
        Train the gesture recognition model
        
        Args:
            X: Training features
            y: Training labels
            epochs: Maximum number of training epochs
            batch_size: Batch size for training
            validation_split: Fraction of data to use for validation
        """
        print("\n" + "="*60)
        print(" "*20 + "MODEL TRAINING")
        print("="*60)
        
        # Split data
        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=validation_split, random_state=42, stratify=y
        )
        
        print(f"\nData split:")
        print(f"  Training samples:   {len(X_train)}")
        print(f"  Validation samples: {len(X_val)}")
        
        # Create model
        input_shape = (X.shape[1], X.shape[2])
        self.model = self.create_model(input_shape)
        
        print(f"\n" + "-"*60)
        print("Model Architecture:")
        print("-"*60)
        self.model.summary()
        
        # Callbacks for training optimization
        callbacks = [
            # Stop training if validation loss doesn't improve
            keras.callbacks.EarlyStopping(
                monitor='val_loss',
                patience=10,
                restore_best_weights=True,
                verbose=1
            ),
            # Reduce learning rate if stuck
            keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=5,
                min_lr=0.00001,
                verbose=1
            ),
            # Save best model
            keras.callbacks.ModelCheckpoint(
                str(self.model_path / "best_model.h5"),
                monitor='val_accuracy',
                save_best_only=True,
                mode='max',
                verbose=1
            )
        ]
        
        # Train model
        print("\n" + "-"*60)
        print("Starting training...")
        print("-"*60 + "\n")
        
        start_time = time.time()
        
        self.history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=batch_size,
            callbacks=callbacks,
            verbose=1
        )
        
        training_time = time.time() - start_time
        
        # Evaluate final model
        print("\n" + "="*60)
        print(" "*20 + "EVALUATION")
        print("="*60)
        
        train_loss, train_acc = self.model.evaluate(X_train, y_train, verbose=0)
        val_loss, val_acc = self.model.evaluate(X_val, y_val, verbose=0)
        
        print(f"\nFinal Results:")
        print(f"  Training accuracy:   {train_acc*100:.2f}%")
        print(f"  Validation accuracy: {val_acc*100:.2f}%")
        print(f"  Training time:       {training_time:.1f} seconds")
        
        # Detailed classification metrics
        y_pred = np.argmax(self.model.predict(X_val, verbose=0), axis=1)
        
        # Get actual classes present in the data
        unique_classes = np.unique(np.concatenate([y_val, y_pred]))
        actual_label_names = [self.label_names[i] for i in sorted(unique_classes)]
        
        print("\n" + "-"*60)
        print("Classification Report:")
        print("-"*60)
        print(classification_report(
            y_val, y_pred,
            labels=sorted(unique_classes),
            target_names=actual_label_names,
            digits=3
        ))
        
        print("\n" + "-"*60)
        print("Confusion Matrix:")
        print("-"*60)
        cm = confusion_matrix(y_val, y_pred, labels=sorted(unique_classes))
        
        # Print header with actual classes
        header = f"{'':12}"
        for cls in sorted(unique_classes):
            header += f" {self.label_names[cls]:>8}"
        print(header)
        
        # Print confusion matrix rows
        for i, cls in enumerate(sorted(unique_classes)):
            row = f"{self.label_names[cls]:12}"
            for j in range(len(unique_classes)):
                row += f" {cm[i][j]:8}"
            print(row)
        
        # Save final model
        model_file = self.model_path / "gesture_classifier.h5"
        self.model.save(str(model_file))
        print(f"\n✓ Model saved to: {model_file}")
        
        # Save training information
        info = {
            "training_date": datetime.now().isoformat(),
            "train_accuracy": float(train_acc),
            "val_accuracy": float(val_acc),
            "train_loss": float(train_loss),
            "val_loss": float(val_loss),
            "epochs_trained": len(self.history.history['loss']),
            "total_epochs": epochs,
            "batch_size": batch_size,
            "training_time_seconds": training_time,
            "input_shape": list(input_shape),
            "num_classes": 3,
            "label_map": self.label_names,
            "total_parameters": int(self.model.count_params())
        }
        
        info_file = self.model_path / "model_info.json"
        with open(str(info_file), 'w') as f:
            json.dump(info, f, indent=2)
        print(f"✓ Training info saved to: {info_file}")
        
        # Plot training history
        self.plot_training_history()
        
        return self.model
    
    def plot_training_history(self):
        """Plot and save training curves"""
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
        
        # Accuracy plot
        ax1.plot(self.history.history['accuracy'], label='Training', linewidth=2)
        ax1.plot(self.history.history['val_accuracy'], label='Validation', linewidth=2)
        ax1.set_title('Model Accuracy', fontsize=14, fontweight='bold')
        ax1.set_xlabel('Epoch', fontsize=12)
        ax1.set_ylabel('Accuracy', fontsize=12)
        ax1.legend(fontsize=10)
        ax1.grid(True, alpha=0.3)
        
        # Loss plot
        ax2.plot(self.history.history['loss'], label='Training', linewidth=2)
        ax2.plot(self.history.history['val_loss'], label='Validation', linewidth=2)
        ax2.set_title('Model Loss', fontsize=14, fontweight='bold')
        ax2.set_xlabel('Epoch', fontsize=12)
        ax2.set_ylabel('Loss', fontsize=12)
        ax2.legend(fontsize=10)
        ax2.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plot_file = self.model_path / "training_history.png"
        plt.savefig(str(plot_file), dpi=150, bbox_inches='tight')
        print(f"✓ Training plot saved to: {plot_file}")
        plt.close()

def main():
    print("\n" + "="*60)
    print(" "*15 + "MODEL TRAINING PIPELINE")
    print(" "*10 + "Gesture Recognition Model Training")
    print("="*60)
    
    print("\nThis script will:")
    print("  1. Load preprocessed training data")
    print("  2. Create an LSTM neural network")
    print("  3. Train the model with validation")
    print("  4. Evaluate performance")
    print("  5. Save the trained model")
    
    print("\n" + "-"*60)
    input("Press Enter to start training...")
    
    trainer = GestureModelTrainer()
    
    # Load data
    X, y = trainer.load_data()
    
    if X is not None:
        print("\n" + "-"*60)
        print("Training Configuration:")
        print("-"*60)
        print(f"  Max epochs:        50")
        print(f"  Batch size:        32")
        print(f"  Validation split:  20%")
        print(f"  Optimizer:         Adam")
        print(f"  Learning rate:     0.001")
        print("-"*60)
        
        # Train model
        model = trainer.train(X, y, epochs=50, batch_size=32)
        
        print("\n" + "="*60)
        print("✓ TRAINING COMPLETE!")
        print("="*60)
        print("\nYour model is ready to use!")
        print("\nNext step: Run 'python 4_test_model.py'")
        print("           This will test the model with your webcam.")
        print("\n" + "="*60)
    else:
        print("\n❌ Training failed - no data loaded.")
        print("   Please run '2_extract_features.py' first.")

if __name__ == "__main__":
    main()

