"""
RESULTS ANALYZER
================
Analyzes test results from CSV files.

Usage:
    python analyze_results.py

What it does:
    - Loads all test result CSV files
    - Generates comprehensive statistics
    - Creates comparison charts
    - Identifies trends and patterns
"""

import pandas as pd
from pathlib import Path
import matplotlib.pyplot as plt
from datetime import datetime
import numpy as np

def load_all_results():
    """Load all test result CSVs"""
    results_dir = Path("test_results")
    csv_files = list(results_dir.glob("*.csv"))
    
    if not csv_files:
        print("No test results found in test_results/")
        return None
    
    print(f"Found {len(csv_files)} test result files")
    
    all_data = []
    for csv_file in csv_files:
        try:
            df = pd.read_csv(csv_file)
            df['test_file'] = csv_file.name
            all_data.append(df)
        except Exception as e:
            print(f"Error loading {csv_file}: {e}")
    
    if not all_data:
        return None
    
    combined = pd.concat(all_data, ignore_index=True)
    return combined

def analyze_results(df):
    """Generate comprehensive analysis"""
    print("\n" + "="*60)
    print(" "*20 + "RESULTS ANALYSIS")
    print("="*60)
    
    # Overall statistics
    total_tests = len(df)
    correct_tests = df['correct'].sum()
    overall_accuracy = (correct_tests / total_tests * 100)
    
    print(f"\nOverall Statistics:")
    print(f"  Total tests: {total_tests}")
    print(f"  Correct: {correct_tests}")
    print(f"  Incorrect: {total_tests - correct_tests}")
    print(f"  Overall Accuracy: {overall_accuracy:.2f}%")
    
    # Per-gesture accuracy
    if 'expected_name' in df.columns:
        print(f"\nPer-Gesture Accuracy:")
        gesture_stats = df.groupby('expected_name').agg({
            'correct': ['count', 'sum', 'mean']
        })
        
        for gesture in gesture_stats.index:
            count = gesture_stats.loc[gesture, ('correct', 'count')]
            correct = gesture_stats.loc[gesture, ('correct', 'sum')]
            accuracy = gesture_stats.loc[gesture, ('correct', 'mean')] * 100
            print(f"  {gesture}:")
            print(f"    Tests: {count}")
            print(f"    Correct: {int(correct)}")
            print(f"    Accuracy: {accuracy:.2f}%")
    
    # Per-tester accuracy (if available)
    if 'tester_name' in df.columns:
        print(f"\nPer-Tester Accuracy:")
        tester_stats = df.groupby('tester_name').agg({
            'correct': ['count', 'sum', 'mean']
        })
        
        for tester in tester_stats.index:
            if pd.notna(tester) and tester != '':
                count = tester_stats.loc[tester, ('correct', 'count')]
                correct = tester_stats.loc[tester, ('correct', 'sum')]
                accuracy = tester_stats.loc[tester, ('correct', 'mean')] * 100
                print(f"  {tester}:")
                print(f"    Tests: {count}")
                print(f"    Accuracy: {accuracy:.2f}%")
    
    # Confusion analysis
    if 'expected_name' in df.columns and 'predicted_name' in df.columns:
        print(f"\nConfusion Analysis:")
        incorrect = df[df['correct'] == False]
        
        if len(incorrect) > 0:
            for expected in df['expected_name'].unique():
                wrong_preds = incorrect[incorrect['expected_name'] == expected]
                if len(wrong_preds) > 0:
                    print(f"  {expected} confused with:")
                    confusion = wrong_preds['predicted_name'].value_counts()
                    for pred, count in confusion.items():
                        print(f"    - {pred}: {int(count)} times")
        else:
            print("  No incorrect predictions!")
    
    # Confidence analysis
    if 'confidence' in df.columns:
        print(f"\nConfidence Statistics:")
        print(f"  Mean confidence: {df['confidence'].mean():.3f}")
        print(f"  Min confidence: {df['confidence'].min():.3f}")
        print(f"  Max confidence: {df['confidence'].max():.3f}")
        
        correct_conf = df[df['correct'] == True]['confidence'].mean()
        incorrect_conf = df[df['correct'] == False]['confidence'].mean()
        
        print(f"  Correct predictions avg confidence: {correct_conf:.3f}")
        if pd.notna(incorrect_conf):
            print(f"  Incorrect predictions avg confidence: {incorrect_conf:.3f}")
    
    return df

def plot_results(df):
    """Create visualization plots"""
    print(f"\nGenerating plots...")
    
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle('Gesture Recognition Test Results', fontsize=16, fontweight='bold')
    
    # Plot 1: Overall accuracy
    ax1 = axes[0, 0]
    correct_count = df['correct'].sum()
    incorrect_count = len(df) - correct_count
    ax1.bar(['Correct', 'Incorrect'], [correct_count, incorrect_count], 
            color=['green', 'red'], alpha=0.7)
    ax1.set_ylabel('Count')
    ax1.set_title('Overall Results')
    ax1.grid(axis='y', alpha=0.3)
    
    # Plot 2: Per-gesture accuracy
    if 'expected_name' in df.columns:
        ax2 = axes[0, 1]
        gesture_acc = df.groupby('expected_name')['correct'].mean() * 100
        gesture_acc.plot(kind='bar', ax=ax2, color='steelblue', alpha=0.7)
        ax2.set_ylabel('Accuracy (%)')
        ax2.set_title('Per-Gesture Accuracy')
        ax2.set_xticklabels(ax2.get_xticklabels(), rotation=45, ha='right')
        ax2.grid(axis='y', alpha=0.3)
        ax2.axhline(y=80, color='orange', linestyle='--', label='80% target')
        ax2.legend()
    
    # Plot 3: Confidence distribution
    if 'confidence' in df.columns:
        ax3 = axes[1, 0]
        ax3.hist(df[df['correct'] == True]['confidence'], bins=20, 
                alpha=0.7, label='Correct', color='green')
        ax3.hist(df[df['correct'] == False]['confidence'], bins=20,
                alpha=0.7, label='Incorrect', color='red')
        ax3.set_xlabel('Confidence')
        ax3.set_ylabel('Count')
        ax3.set_title('Confidence Distribution')
        ax3.legend()
        ax3.grid(alpha=0.3)
    
    # Plot 4: Per-tester accuracy (if available)
    if 'tester_name' in df.columns:
        ax4 = axes[1, 1]
        tester_df = df[df['tester_name'].notna() & (df['tester_name'] != '')]
        if len(tester_df) > 0:
            tester_acc = tester_df.groupby('tester_name')['correct'].mean() * 100
            tester_acc.plot(kind='bar', ax=ax4, color='coral', alpha=0.7)
            ax4.set_ylabel('Accuracy (%)')
            ax4.set_title('Per-Tester Accuracy')
            ax4.set_xticklabels(ax4.get_xticklabels(), rotation=45, ha='right')
            ax4.grid(axis='y', alpha=0.3)
            ax4.axhline(y=80, color='orange', linestyle='--', label='80% target')
            ax4.legend()
        else:
            ax4.text(0.5, 0.5, 'No tester data available', 
                    ha='center', va='center', transform=ax4.transAxes)
            ax4.set_title('Per-Tester Accuracy')
    
    plt.tight_layout()
    
    # Save plot
    plot_file = Path("test_results") / f"analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
    plt.savefig(plot_file, dpi=150, bbox_inches='tight')
    print(f"✓ Plot saved to: {plot_file}")
    
    plt.show()

def main():
    print("\n" + "="*60)
    print(" "*18 + "RESULTS ANALYZER")
    print(" "*15 + "Test Results Analysis")
    print("="*60)
    
    # Load data
    df = load_all_results()
    
    if df is None:
        print("\n❌ No test results to analyze")
        print("\nRun testing first:")
        print("  python 5_accuracy_test.py")
        print("  python 6_team_accuracy_test.py")
        return
    
    # Analyze
    analyze_results(df)
    
    # Plot
    try:
        plot_results(df)
    except Exception as e:
        print(f"\n⚠ Could not generate plots: {e}")
    
    print("\n" + "="*60)
    print("✓ Analysis complete!")
    print("="*60)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


